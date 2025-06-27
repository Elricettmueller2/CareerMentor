FROM python:3.11

WORKDIR /app

COPY *.py ./
# Only reinstall poetry if pyproject files change
COPY pyproject.toml poetry.lock* ./

# Install poetry & dependencies
RUN pip install --no-cache-dir poetry \
 && poetry config virtualenvs.create false \
 && poetry install --no-interaction --no-ansi --no-root

# Install additional packages needed for web scraping, AI, and MongoDB
RUN pip install --no-cache-dir beautifulsoup4 requests litellm pymongo

# Copy specific directories
COPY crews/ ./crews/
COPY database/ ./database/
COPY services/ ./services/

# Create .env file if it doesn't exist
RUN touch .env
# Try multiple possible MongoDB connection strings to improve reliability
RUN echo "MONGO_URI=mongodb://host.docker.internal:27017" >> .env
RUN echo "MONGO_DB_NAME=career-mentor" >> .env

# Create directories if they don't exist in the project yet
RUN mkdir -p static
RUN mkdir -p tools

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
