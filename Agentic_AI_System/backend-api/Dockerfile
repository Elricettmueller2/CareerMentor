FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for PyMuPDF and other packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libssl-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Only reinstall poetry if pyproject files change
COPY pyproject.toml poetry.lock* ./

# Install poetry & dependencies with improved error handling
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir poetry \
    && poetry config virtualenvs.create false \
    && poetry lock \
    && poetry install --no-interaction --no-ansi --no-root

# Copy Python files
COPY *.py ./

# Install additional packages needed for web scraping, AI, and MongoDB
RUN pip install --no-cache-dir beautifulsoup4 requests litellm pymongo

# Copy specific directories
COPY crews/ ./crews/
COPY database/ ./database/
COPY services/ ./services/

# Copy .env.example to .env for configuration
COPY .env.example .env

# Create directories if they don't exist in the project yet
RUN mkdir -p static
RUN mkdir -p tools

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
