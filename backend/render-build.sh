#!/usr/bin/env bash
set -e

# Make sure Python is installed in the Render build environment
apt-get update && apt-get install -y python3 python3-pip

# Install your Python dependencies
pip3 install -r backend/requirements.txt

# Install your Node.js dependencies
npm install
