import sys
import json
import traceback
from langchain_community.vectorstores import FAISS
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
import os

def perform_rag_search(query):
    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Define the db directory relative to the script location
        db_dir = os.path.join(script_dir, "db")
        idx_name = "nco_data"
        
        print(f"Script directory: {script_dir}", file=sys.stderr)
        print(f"DB directory: {db_dir}", file=sys.stderr)
        print(f"Looking for index: {idx_name}", file=sys.stderr)
        
        # Load environment variables from .env file
        env_path = os.path.join(script_dir, ".env")
        load_dotenv(env_path)
        
        # Get API key
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        print("API key loaded successfully", file=sys.stderr)
        
        # Initialize the LLM
        llm = ChatGoogleGenerativeAI(model='gemini-2.5-flash', google_api_key=api_key)
        
        # Initialize the embedding model
        modelPath = "intfloat/multilingual-e5-large"
        model_kwargs = {'device': 'cpu'}
        encode_kwargs = {'normalize_embeddings': False}
        embedding_model = HuggingFaceEmbeddings(
            model_name=modelPath,
            model_kwargs=model_kwargs,
            encode_kwargs=encode_kwargs
        )
        
        print("Embedding model initialized", file=sys.stderr)
        
        # Check if the database files exist
        faiss_index_path = os.path.join(db_dir, f"{idx_name}.faiss")
        pkl_path = os.path.join(db_dir, f"{idx_name}.pkl")
        
        if not os.path.exists(faiss_index_path) or not os.path.exists(pkl_path):
            raise FileNotFoundError(f"Vector database files not found at {db_dir}")
        
        print(f"Database files found at {db_dir}", file=sys.stderr)
        
        # Load the vector database
        faissdb = FAISS.load_local(
            folder_path=db_dir,
            embeddings=embedding_model,
            index_name=idx_name,
            allow_dangerous_deserialization=True,
        )
        
        print("Vector database loaded successfully", file=sys.stderr)
        
        # Perform the similarity search
        results_with_scores = faissdb.similarity_search_with_score(query, k=1)
        
        # Format the results
        result_string = ""
        for rank, (doc, score) in enumerate(results_with_scores, start=1):
            result_string += f"\n\nRank: {rank}\n"
            result_string += f"Confidence Score: {score:.4f}\n"
            result_string += f"Matched Content:\n {doc.page_content}\n\n"
        
        print("Search completed successfully", file=sys.stderr)
        
        # Create the prompt for the LLM
        prompt = f"""
        You are an llm supposed to answer only based on the relevant data provided.
        ** You should answer only in the user query language.**

        query: {query}

        relevant data: {result_string}
        """
        
        # Get the answer from the LLM
        llm_answer = llm.invoke(prompt)
        
        # Return the results
        return {
            'llm_answer': llm_answer.content,
            'matches': result_string
        }
    
    except Exception as e:
        error_traceback = traceback.format_exc()
        print(f"Error in RAG search: {str(e)}", file=sys.stderr)
        print(error_traceback, file=sys.stderr)
        return {
            'error': str(e),
            'traceback': error_traceback,
            'llm_answer': f"Sorry, I encountered an error while searching: {str(e)}",
            'matches': "No matches found due to an error."
        }

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            query = sys.argv[1]
            result = perform_rag_search(query)
            print(json.dumps(result))
        else:
            print(json.dumps({
                'error': 'No query provided',
                'llm_answer': 'Please provide a search query',
                'matches': 'No query was provided to search with'
            }))
    except Exception as e:
        error_traceback = traceback.format_exc()
        print(json.dumps({
            'error': str(e),
            'traceback': error_traceback,
            'llm_answer': f"Sorry, I encountered an error: {str(e)}",
            'matches': "No matches found due to an error."
        }))