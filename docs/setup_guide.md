# CareerMentor Backend Setup Guide

A streamlined guide for setting up the CareerMentor backend API with its agent-based architecture.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Ollama](https://ollama.ai/download) (for local LLM support)

## Quick Setup

### 1. Start Ollama

```bash
# Pull the required model
ollama pull llama3

# Start Ollama server
ollama serve
```

### 2. Configure Environment

```bash
cd Agentic_AI_System/backend-api
cp .env.example .env
```

### 3. Build & Run with Docker

```bash
# Build the Docker image
docker build -t career-mentor-backend .

# Run the container
docker run -p 8000:8000 -e OLLAMA_BASE_URL=http://host.docker.internal:11434 career-mentor-backend
```

### 4. Verify Installation

```bash
# Test the health check endpoint
curl "http://localhost:8000/healthcheck?test=hello"
```

## Agent System Architecture

The backend implements multiple AI agents, each with specific capabilities:

| Agent | Purpose | Status |
|-------|---------|--------|
| MockMate | Interview simulation | Implemented |
| PathFinder | Career path recommendations | Planned |
| ResumeRefiner | Resume improvement suggestions | Planned |
| TrackPal | Learning track recommendations | Planned |

## API Structure

All agents follow a consistent API pattern:

```
/agents/{agent_name}/{action}
```

Each agent endpoint accepts a JSON payload with a `data` object containing the parameters specific to that agent and action.

## Development Notes

- **Docker Workflow**: Rebuild the image after any code changes
- **API Documentation**: Available at http://localhost:8000/docs
- **Agent Implementation**: Each agent is a standalone module in the `agents/` directory
- **Environment Variables**:
  - `OLLAMA_BASE_URL`: URL of the Ollama server (default: http://localhost:11434)
  - `DEFAULT_MODEL`: LLM model to use (default: llama3)

## Adding New Agents

To add a new agent:

1. Create a new directory under `agents/`
2. Implement the agent class with appropriate methods
3. Update `main.py` to add routes for the new agent

## Troubleshooting

- **"Address already in use"**: Stop existing containers with `docker ps` and `docker stop <container-id>`
- **"No module named 'agents'"**: Ensure the Dockerfile copies all project files (`COPY . .`)
- **Ollama Connection**: Use `http://host.docker.internal:11434` as the Ollama URL when running in Docker
