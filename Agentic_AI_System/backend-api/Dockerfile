FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for PyMuPDF and other packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libssl-dev \
    curl \
    gnupg \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install ngrok properly from official source
RUN curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | tee /etc/apt/sources.list.d/ngrok.list && \
    apt-get update && apt-get install -y ngrok && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Verify ngrok installation
RUN ngrok --version

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

# Install additional packages needed for web scraping, AI, MongoDB, and ngrok automation
RUN pip install --no-cache-dir beautifulsoup4 requests litellm pymongo python-dotenv

# Make the start_with_ngrok.py script executable
RUN chmod +x start_with_ngrok.py

# Copy specific directories
COPY crews/ ./crews/
COPY services/ ./services/

# Copy .env.example to .env for configuration
COPY .env.example .env

# Create directories if they don't exist in the project yet
RUN mkdir -p static
RUN mkdir -p tools

EXPOSE 8000

# Use the start_with_ngrok.py script as the entrypoint with unbuffered output
CMD ["python", "-u", "start_with_ngrok.py"]
