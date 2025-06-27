# CareerMentor Docker Setup Guide

This document provides instructions for setting up and running the CareerMentor application using Docker containers.

## Container Architecture

CareerMentor uses a multi-container setup with two main containers:

1. **Backend API Container** (`career-mentor-backend-container`)
   - Runs the FastAPI backend service
   - Handles API requests from the frontend
   - Connects to the MongoDB database

2. **MongoDB Container** (`career-mentor-mongodb`)
   - Runs the MongoDB database service
   - Stores global state and user data
   - Provides persistence for the application

### Why Separate Containers?

We use separate containers for the application and database for several important reasons:

1. **Separation of Concerns**: Each container has a single responsibility, making the system more maintainable and easier to debug.

2. **Independent Scaling**: Database and application services often have different scaling requirements. Separate containers allow us to scale each service independently.

3. **Data Persistence**: Database containers can be configured with persistent volumes, ensuring data survives container restarts without affecting the application container.

4. **Security**: Separation provides better isolation between services, reducing the attack surface.

5. **Flexibility**: We can update or replace one container without affecting the other. For example, we can update the backend code without touching the database.

6. **Specialized Optimization**: Each container can be optimized for its specific workload (memory for database, CPU for application).

## Setup Instructions

### 1. Running the MongoDB Container

```bash
# Run MongoDB container
docker run -d --name career-mentor-mongodb -p 27017:27017 mongo:latest
```

This command creates a MongoDB container named `career-mentor-mongodb` that:  
- Runs in detached mode (`-d`)  
- Maps port 27017 from the container to your host machine  
- Uses the latest MongoDB image from Docker Hub

### 2. Building the Backend Container

```bash
# Navigate to the backend directory
cd /Users/elricettmuller/Programming/CareerMentor/Agentic_AI_System/backend-api

# Build the backend image
docker build -t career-mentor-backend:latest .
```

This builds the backend Docker image with:
- Python 3.11 as the base image
- All Poetry dependencies installed
- MongoDB Python driver (pymongo) installed
- MongoDB connection configuration

### 3. Running the Backend Container

```bash
# Run the backend container with host networking for MongoDB access
docker run -d --name career-mentor-backend-container -p 8000:8000 --add-host=host.docker.internal:host-gateway career-mentor-backend:latest
```

This command:
- Creates a container named `career-mentor-backend-container`
- Runs in detached mode (`-d`)
- Maps port 8000 from the container to your host machine
- Adds a host entry for `host.docker.internal` to allow the container to connect to services on your host machine
- Uses the `career-mentor-backend:latest` image we built

## Environment Configuration

### MongoDB Connection Settings

The backend container is configured to connect to MongoDB using environment variables:

- `MONGO_URI`: The connection URI for MongoDB (default: `mongodb://host.docker.internal:27017`)
- `MONGO_DB_NAME`: The name of the MongoDB database (default: `career-mentor`)

These variables are set in the Dockerfile but can be overridden when running the container:

```bash
docker run -d --name career-mentor-backend-container -p 8000:8000 \
  -e MONGO_URI=mongodb://custom-host:27017 \
  -e MONGO_DB_NAME=custom-db-name \
  career-mentor-backend:latest
```

### MongoDB Connection Strategy

The MongoDB client in `services/mongodb/client.py` implements a robust connection strategy:

1. First tries the URI specified in the environment variable
2. If that fails, tries alternative connection methods:
   - `mongodb://host.docker.internal:27017` (for Docker on Mac/Windows)
   - `mongodb://172.17.0.1:27017` (common Docker bridge network)
   - `mongodb://mongodb:27017` (if using default container name)
   - `mongodb://career-mentor-mongodb:27017` (using our naming convention)

## Troubleshooting

### MongoDB Connection Issues

If the backend can't connect to MongoDB, try these solutions:

1. Ensure both containers are running:
   ```bash
   docker ps | grep career-mentor
   ```

2. Check MongoDB logs:
   ```bash
   docker logs career-mentor-mongodb
   ```

3. Check backend logs:
   ```bash
   docker logs career-mentor-backend-container
   ```

4. Verify network connectivity:
   ```bash
   docker exec -it career-mentor-backend-container ping career-mentor-mongodb
   ```

5. Try alternative MongoDB connection strings in the `.env` file:
   - `mongodb://host.docker.internal:27017` (Mac/Windows)
   - `mongodb://172.17.0.1:27017` (Docker bridge network)
   - `mongodb://career-mentor-mongodb:27017` (Container name)

### Frontend Connection Issues

If the frontend Expo app can't connect to the backend:

1. Ensure the backend API is accessible:
   ```bash
   curl http://localhost:8000/global-state
   ```

2. Check that your frontend is using the correct API URL:
   - For local development: `http://localhost:8000`
   - For mobile devices: Use your computer's IP address instead of localhost
   - For Android emulator: `http://10.0.2.2:8000`

3. The frontend GlobalSyncService.ts has a fallback mechanism that tries different URLs:
   ```typescript
   const API_URLS = {
     emulator: 'http://10.0.2.2:8000', // Android emulator
     localhost: 'http://localhost:8000', // iOS simulator or web
     device: 'http://192.168.1.100:8000' // Adjust this IP to your computer's IP
   };
   ```

4. If you're experiencing connection issues, update the `device` URL in GlobalSyncService.ts with your actual IP address:
   ```typescript
   device: 'http://YOUR_ACTUAL_IP:8000'
   ```

## Maintenance

### Stopping Containers

```bash
docker stop career-mentor-backend-container career-mentor-mongodb
```

### Removing Containers

```bash
docker rm career-mentor-backend-container career-mentor-mongodb
```

### Updating the Backend

```bash
# Build a new image
docker build -t career-mentor-backend:latest .

# Stop and remove the old container
docker stop career-mentor-backend-container
docker rm career-mentor-backend-container

# Run a new container with the updated image
docker run -d --name career-mentor-backend-container -p 8000:8000 --add-host=host.docker.internal:host-gateway career-mentor-backend:latest
```
