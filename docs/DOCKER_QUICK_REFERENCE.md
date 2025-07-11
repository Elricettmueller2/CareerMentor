# CareerMentor Docker Quick Reference

Quick reference for setting up and running the CareerMentor application using Docker.

## Automated Startup (Recommended)

We've created an automated startup script that handles everything for you:
1. Builds and starts the backend Docker container
2. Configures ngrok with your auth token
3. Automatically updates the mobile app's API endpoints with the ngrok URL

### Prerequisites

- Docker installed and running
- ngrok account with auth token (free tier is sufficient)
- Update your `.env` file with your ngrok auth token

### One-Command Startup

```bash
# From the project root directory
chmod +x start_careermentor.sh  # Make the script executable (first time only)
./start_careermentor.sh
```

The script will:
1. Build the Docker image if needed
2. Start the container with all required environment variables
3. Wait for ngrok to establish a tunnel
4. Extract the ngrok URL from the container logs
5. Automatically update the mobile app's API endpoints file
6. Display the ngrok URL and other useful information

### Stopping the Backend

```bash
docker stop careermentor-backend
```

## Instant Backend Container Setup

Copy and paste these commands to quickly rebuild and restart the backend container:

```bash
# Stop and remove existing container
docker stop careermentor-backend
docker rm careermentor-backend

# Build and run with proper environment variables
cd Agentic_AI_System/backend-api
docker build -t careermentor-backend .
docker run -d --name careermentor-backend -p 8000:8000 --add-host=host.docker.internal:host-gateway -e OLLAMA_BASE_URL=http://host.docker.internal:11434 -e ADZUNA_APP_ID=ac7d329d -e ADZUNA_API_KEY=fd74aa940604de795dcd178d167fc279 -e NGROK_AUTH_TOKEN=2zDpejeNtHCsBDVnn5zPPVjEsli_6GNhAU5z8syBUcpceWJZY careermentor-backend

# Check logs
docker logs careermentor-backend
```

## Creating Containers

### MongoDB Container

```bash
# Create and start MongoDB container
docker run -d --name career-mentor-mongodb -p 27017:27017 mongo:latest

# If container already exists but is stopped
docker start career-mentor-mongodb

# Remove MongoDB container (must be stopped first)
docker stop career-mentor-mongodb
docker rm career-mentor-mongodb
```

### Backend Container

```bash
# Build backend image
cd Agentic_AI_System/backend-api
docker build -t careermentor-backend .

# Create and start backend container with environment variables
docker run -d --name careermentor-backend -p 8000:8000 --add-host=host.docker.internal:host-gateway -e OLLAMA_BASE_URL=http://host.docker.internal:11434 -e ADZUNA_APP_ID=ac7d329d -e ADZUNA_API_KEY=fd74aa940604de795dcd178d167fc279 careermentor-backend

# If container already exists but is stopped
docker start careermentor-backend

# Remove backend container (must be stopped first)
docker stop careermentor-backend
docker rm careermentor-backend

# Rebuild and recreate after code changes
docker stop careermentor-backend
docker rm careermentor-backend
docker build -t careermentor-backend .
docker run -d --name careermentor-backend -p 8000:8000 --add-host=host.docker.internal:host-gateway -e OLLAMA_BASE_URL=http://host.docker.internal:11434 -e ADZUNA_APP_ID=ac7d329d -e ADZUNA_API_KEY=fd74aa940604de795dcd178d167fc279 careermentor-backend
```

## Useful Commands

```bash
# Check container status
docker ps
docker ps -a  # Show all containers including stopped ones

# View container logs
docker logs careermentor-backend
docker logs career-mentor-mongodb

# Check environment variables in container
docker exec careermentor-backend env

# Stop all containers
docker stop careermentor-backend career-mentor-mongodb

# Remove all containers
docker rm careermentor-backend career-mentor-mongodb

# Test API connectivity
curl http://localhost:8000/healthcheck

# Enter container shell
docker exec -it careermentor-backend /bin/bash
```

## Frontend Configuration

Update API URLs in mobile app services to match your local IP:
```typescript
// In TrackPalService.ts and other service files
const API_URLS = {
  emulator: 'http://10.0.2.2:8000',
  localhost: 'http://localhost:8000',
  device: 'http://YOUR_ACTUAL_IP:8000'  // Replace with your IP
};
```
