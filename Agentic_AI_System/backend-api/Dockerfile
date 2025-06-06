FROM python:3.11

WORKDIR /app

RUN pip install --no-cache-dir poetry

# Copy dependency files first for better caching
COPY pyproject.toml poetry.lock* ./
RUN poetry install --no-root --no-interaction

# Copy the entire project directory
COPY . .

EXPOSE 8000

CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
