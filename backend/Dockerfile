# Use a lightweight Python base image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install system dependencies
# - ffmpeg: required for Whisper & Librosa audio loading
# - espeak: required for pyttsx3 Text-to-Speech on Linux
# - build-essential: required for compile-on-install pip packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    espeak \
    libsndfile1 \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download SpaCy Models
RUN python -m spacy download en_core_web_sm

# Pre-cache AI/ML models during build to avoid download delays at runtime
RUN python -c "import whisper; whisper.load_model('base')"
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy project files
COPY . .

# Expose port and start backend
EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
