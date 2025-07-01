FROM python:3.11

WORKDIR /app

COPY *.py ./
# Only reinstall poetry if pyproject files change
COPY pyproject.toml poetry.lock* ./

# Install poetry & dependencies
RUN pip install --no-cache-dir poetry \
 && poetry config virtualenvs.create false \
 && rm -f poetry.lock \
 && poetry install --no-interaction --no-ansi --no-root

# Install additional packages needed for web scraping and AI
RUN pip install --no-cache-dir beautifulsoup4 requests litellm

# Copy specific directories
COPY crews/ ./crews/
COPY database/ ./database/
COPY services/ ./services/

# Create directories if they don't exist in the project yet
RUN mkdir -p static
RUN mkdir -p tools

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
