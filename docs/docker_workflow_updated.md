# CareerMentor Docker Workflow

This document provides the complete workflow for setting up and running the CareerMentor backend in Docker, including proper environment variable configuration for Ollama and other services.

## Prerequisites

- Docker installed and running
- Ollama running locally on port 11434
- MongoDB running locally on port 27017

## Initial Setup

### 1. Build the Docker image

Navigate to the backend-api directory and build the image:

```bash
cd Agentic_AI_System/backend-api
docker build -t careermentor-backend .
```

### 2. Run the Docker container with proper environment variables

Run the container with the following command to ensure all services can communicate properly:

```bash
docker run -d --name careermentor-backend -p 8000:8000 --add-host=host.docker.internal:host-gateway -e OLLAMA_BASE_URL=http://host.docker.internal:11434 -e ADZUNA_APP_ID=ac7d329d -e ADZUNA_API_KEY=fd74aa940604de795dcd178d167fc279 careermentor-backend
```

This command:
- Maps port 8000 in the container to port 8000 on the host
- Adds host.docker.internal mapping to allow container to access host services
- Sets the OLLAMA_BASE_URL environment variable to connect to Ollama on the host
- Sets the Adzuna API credentials for job search functionality

## Verification

### 1. Check if the container is running

```bash
docker ps
```

### 2. View container logs

```bash
docker logs careermentor-backend
```

### 3. Test API connectivity

```bash
curl http://localhost:8000/healthcheck
```

## Stopping and Restarting

### 1. Stop the container

```bash
docker stop careermentor-backend
```

### 2. Remove the container

```bash
docker rm careermentor-backend
```

### 3. Rebuild after code changes

If you've made changes to the backend code, rebuild the image:

```bash
cd Agentic_AI_System/backend-api
docker build -t careermentor-backend .
```

Then run the container again with the command from the Initial Setup section.

## Troubleshooting

### 1. Check environment variables in container

```bash
docker exec careermentor-backend env
```

### 2. Check MongoDB connection

```bash
docker exec careermentor-backend curl mongodb://host.docker.internal:27017
```

### 3. Check Ollama connection

```bash
docker exec careermentor-backend curl http://host.docker.internal:11434/api/version
```

## Notes

- The backend container needs to use `host.docker.internal` to access services running on the host machine (like Ollama and MongoDB)
- Environment variables must be explicitly set when running the container to ensure proper connectivity
- After code changes, you must rebuild and restart the container
