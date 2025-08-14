import sys
import json
import traceback
import time
import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout

# Prefer stable, container-persistent caches if available
# You can override these via Render env vars to point to a persistent disk.
def _ensure_cache_env(script_dir: str):
    # Fall back to a local project cache so repeated calls within the same container are fast
    default_cache = os.path.join(script_dir, ".cache")
    os.makedirs(default_cache, exist_ok=True)

    os.environ.setdefault("HF_HOME", os.path.join(default_cache, "hf"))
    os.environ.setdefault("TRANSFORMERS_CACHE", os.path.join(default_cache, "transformers"))
    os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", os.path.join(default_cache, "sentence-transformers"))

_START_TIME = time.time()

def _log(msg: str):
    print(f"[rag] {msg}", file=sys.stderr, flush=True)

try:
    from dotenv import load_dotenv
    from langchain_community.vectorstores import FAISS
    from langchain_huggingface.embeddings import HuggingFaceEmbeddings
    from langchain_google_genai import ChatGoogleGenerativeAI
except Exception as _e:
    print(f"[rag] Failed to import dependencies: {_e}", file=sys.stderr, flush=True)
    raise

# ------------------------------------------------------------------------------------
# Resolve paths and caching early
# ------------------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(SCRIPT_DIR, "db")
INDEX_NAME = os.getenv("FAISS_INDEX_NAME", "nco_data")

_log(f"Script directory: {SCRIPT_DIR}")
_log(f"DB directory: {DB_DIR}")
_log(f"Looking for index: {INDEX_NAME}")

_ensure_cache_env(SCRIPT_DIR)

# ------------------------------------------------------------------------------------
# Load env & config once at module import (so a long-running process pays the cost once)
# If your architecture spawns a fresh Python process per request, pair this with a
# Render build step or a persistent disk to avoid cold downloads each time.
# ------------------------------------------------------------------------------------
ENV_PATH = os.path.join(SCRIPT_DIR, ".env")
load_dotenv(ENV_PATH)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment variables")

# Tunables via env
DEFAULT_K = int(os.getenv("RAG_TOP_K", "1"))
LLM_TIMEOUT_SEC = int(os.getenv("LLM_TIMEOUT_SEC", "60"))  # Timeout just for the LLM call
EMBED_MODEL_NAME = os.getenv("EMBED_MODEL_NAME", "intfloat/multilingual-e5-large")

_log("API key loaded successfully")

# ------------------------------------------------------------------------------------
# Validate FAISS index existence before heavy loads
# ------------------------------------------------------------------------------------
FAISS_INDEX_PATH = os.path.join(DB_DIR, f"{INDEX_NAME}.faiss")
PKL_PATH = os.path.join(DB_DIR, f"{INDEX_NAME}.pkl")

if not (os.path.exists(FAISS_INDEX_PATH) and os.path.exists(PKL_PATH)):
    raise FileNotFoundError(f"Vector database files not found at {DB_DIR} (expected {INDEX_NAME}.faiss and {INDEX_NAME}.pkl)")

# ------------------------------------------------------------------------------------
# Initialize heavy components once
# ------------------------------------------------------------------------------------
t0 = time.time()
_log("Initializing embedding model...")
_embedding_model = HuggingFaceEmbeddings(
    model_name=EMBED_MODEL_NAME,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": False},
)
_log(f"Embedding model initialized in {time.time() - t0:.2f}s")

t1 = time.time()
_log("Loading FAISS index...")
_faissdb = None
try:
    _faissdb = FAISS.load_local(
        folder_path=DB_DIR,
        embeddings=_embedding_model,
        index_name=INDEX_NAME,
        allow_dangerous_deserialization=True,
    )
    _log(f"Vector database loaded successfully in {time.time() - t1:.2f}s")
except Exception as e:
    _log(f"Failed to load FAISS index: {e}")
    raise

t2 = time.time()
_log("Initializing LLM client...")
_llm = ChatGoogleGenerativeAI(
    model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
    google_api_key=GOOGLE_API_KEY,
)
_log(f"LLM client initialized in {time.time() - t2:.2f}s")
_log(f"Module ready in {time.time() - _START_TIME:.2f}s total.")

# ------------------------------------------------------------------------------------
# Core function
# ------------------------------------------------------------------------------------
def _invoke_llm_with_timeout(prompt: str, timeout_sec: int):
    # Wrap LLM call in a thread to enforce a timeout
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_llm.invoke, prompt)
        return future.result(timeout=timeout_sec)

def perform_rag_search(query: str, k: int | None = None):
    try:
        if not isinstance(query, str) or not query.strip():
            raise ValueError("Query must be a non-empty string")

        k_val = int(k or DEFAULT_K)
        if k_val <= 0:
            k_val = 1

        _log(f"Starting similarity search (k={k_val})...")
        t_search = time.time()
        results_with_scores = _faissdb.similarity_search_with_score(query, k=k_val)
        _log(f"Similarity search completed in {time.time() - t_search:.2f}s")

        # Format matches
        result_string = ""
        for rank, (doc, score) in enumerate(results_with_scores, start=1):
            result_string += f"\n\nRank: {rank}\n"
            result_string += f"Confidence Score: {score:.4f}\n"
            result_string += f"Matched Content:\n {doc.page_content}\n\n"

        # Build strict prompt
        prompt = f"""
You are an LLM that must answer only using the relevant data provided below.
If the answer is not present, reply with "I don't know".
Always answer in the language of the user query.

Query:
{query}

Relevant data:
{result_string}
""".strip()

        _log(f"Calling LLM (timeout={LLM_TIMEOUT_SEC}s)...")
        t_llm = time.time()
        llm_answer = _invoke_llm_with_timeout(prompt, timeout_sec=LLM_TIMEOUT_SEC)
        _log(f"LLM completed in {time.time() - t_llm:.2f}s")

        return {
            "llm_answer": getattr(llm_answer, "content", str(llm_answer)),
            "matches": result_string or "No matches returned.",
        }

    except FuturesTimeout:
        _log("LLM call timed out.")
        return {
            "error": f"LLM call exceeded {LLM_TIMEOUT_SEC}s timeout",
            "llm_answer": f"Sorry, the language model timed out after {LLM_TIMEOUT_SEC} seconds.",
            "matches": "Search was performed, but the answer generation timed out.",
            "traceback": "",
        }
    except Exception as e:
        error_traceback = traceback.format_exc()
        _log(f"Error in RAG search: {str(e)}")
        _log(error_traceback)
        return {
            "error": str(e),
            "traceback": error_traceback,
            "llm_answer": f"Sorry, I encountered an error while searching: {str(e)}",
            "matches": "No matches found due to an error.",
        }

# ------------------------------------------------------------------------------------
# CLI entrypoint (kept compatible with your existing frontend integration)
# ------------------------------------------------------------------------------------
if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            query = sys.argv[1]
            # Optional third arg for k
            k = int(sys.argv[2]) if len(sys.argv) > 2 else None
            result = perform_rag_search(query, k=k)
            print(json.dumps(result))
        else:
            print(json.dumps({
                "error": "No query provided",
                "llm_answer": "Please provide a search query",
                "matches": "No query was provided to search with"
            }))
    except Exception as e:
        error_traceback = traceback.format_exc()
        print(json.dumps({
            "error": str(e),
            "traceback": error_traceback,
            "llm_answer": f"Sorry, I encountered an error: {str(e)}",
            "matches": "No matches found due to an error."
        }))
