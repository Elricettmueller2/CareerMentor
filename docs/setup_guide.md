# CareerMentor Setup Guide

A comprehensive guide for setting up the CareerMentor project with its agent-based architecture, including both backend API and mobile app components.

## Project Overview

CareerMentor consists of two main components:
- **Backend API**: FastAPI-based server with AI agents using CrewAI
- **Mobile App**: React Native/Expo mobile application

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Ollama](https://ollama.ai/download) (for local LLM support)
- [Node.js](https://nodejs.org/) (for mobile app development)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (for mobile app development)

## Backend Setup

### Option 1: Using Docker (Recommended)

1. **Clone the repository**

```bash
git clone https://github.com/Elricettmueller2/CareerMentor.git
cd CareerMentor
```

2. **Configure Environment**

```bash
cd Agentic_AI_System/backend-api
cp .env.example .env
```

3. **Build and Run with Docker**

```bash
docker build -t careermentor-backend .
docker run -p 8000:8000 --env-file .env careermentor-backend
```

### Option 2: Local Development Setup

1. **Install Ollama and Pull Required Model**

```bash
# Pull the required model
ollama pull llama3.2

# Start Ollama server
ollama serve
```

2. **Configure Backend Environment**

```bash
cd Agentic_AI_System/backend-api
cp .env.example .env
```

3. **Install Dependencies and Run**

```bash
# Install Poetry if not already installed
pip install poetry

# Install dependencies
poetry install

# Run the FastAPI server
poetry run uvicorn main:app --host 0.0.0.0 --port 8000
```

## Mobile App Setup

1. **Navigate to the Mobile App Directory**

```bash
cd Agentic_AI_System/mobile-app/CareerMentor
```

2. **Install Dependencies**

```bash
npm install
```

3. **Start the Expo Development Server**

```bash
npm start
```

4. **Run on Device or Emulator**
   - Press `i` to run on iOS simulator
   - Press `a` to run on Android emulator
   - Scan the QR code with the Expo Go app on your physical device

## Docker Workflow

### Initial Setup

```bash
# Navigate to the backend directory
cd Agentic_AI_System/backend-api

# Build the Docker image
docker build -t careermentor-backend .

# Run the container
docker run -p 8000:8000 --env-file .env --name careermentor-api careermentor-backend
```

### After Making Changes

When you make changes to the backend code, you need to rebuild the Docker image:

```bash
# Stop the running container
docker stop careermentor-api
docker rm careermentor-api

# Rebuild the image
docker build -t careermentor-backend .

# Run the container with the new image
docker run -p 8000:8000 --env-file .env --name careermentor-api careermentor-backend
```

### Development Workflow

For a more efficient development workflow, you can mount your local code directory as a volume:

```bash
docker run -p 8000:8000 --env-file .env -v $(pwd):/app --name careermentor-api careermentor-backend
```

This allows you to make changes to the code without rebuilding the Docker image.

## API Endpoints

The backend API exposes the following endpoints:

- `GET /healthcheck`: Check if the API is running
- `POST /agents/mock_mate/start_interview`: Start a mock interview
- `POST /agents/mock_mate/respond`: Get a response to a user answer
- `POST /agents/mock_mate/review`: Get a review of the interview

## Troubleshooting

### Ollama Connection Issues

If you're running the backend in Docker and Ollama locally, you might need to update the `OLLAMA_BASE_URL` in your `.env` file:

```
# For macOS
OLLAMA_BASE_URL=http://host.docker.internal:11434

# For Linux
OLLAMA_BASE_URL=http://172.17.0.1:11434
```

### Mobile App Connection Issues

Ensure the backend API URL in the mobile app is correctly pointing to your backend server. If running on a physical device, you might need to use your computer's local network IP instead of localhost.

## Verifying Installation

```bash
# Test the health check endpoint
curl "http://localhost:8000/healthcheck?test=hello"
```

You should receive a JSON response confirming the API is working.

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

## Development Workflow

### Making Changes to the Backend

1. Make your code changes in the `Agentic_AI_System/backend-api` directory
2. If using Docker with volume mounting, changes will be reflected immediately
3. If using standard Docker deployment, rebuild the image as described in the Docker workflow section

### Making Changes to the Mobile App

1. Make your code changes in the `Agentic_AI_System/mobile-app/CareerMentor` directory
2. The Expo development server will automatically reload with your changes

## Contributing

When contributing to the project, please follow these guidelines:

1. Create a feature branch from `development`
2. Make your changes and test thoroughly
3. Submit a pull request to merge back into `development`
4. Once approved, changes will be merged into `master` for releases

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
