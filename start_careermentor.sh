#!/bin/bash

# CareerMentor Startup Script
# This script starts the CareerMentor backend in Docker and updates the mobile app's API endpoints

# Configuration
CONTAINER_NAME="careermentor-backend"
MONGODB_CONTAINER_NAME="career-mentor-mongodb"
NGROK_AUTH_TOKEN="2zDpejeNtHCsBDVnn5zPPVjEsli_6GNhAU5z8syBUcpceWJZY"
NGROK_STATIC_DOMAIN="evident-hyena-lately.ngrok-free.app"
MOBILE_APP_ENDPOINTS_PATH="Agentic_AI_System/mobile-app/CareerMentor/constants/ApiEndpoints.ts"
BACKEND_DIR="Agentic_AI_System/backend-api"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== CareerMentor Startup ===${NC}"

# Check if we're in the right directory
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Cannot find backend directory at $BACKEND_DIR${NC}"
    echo "Please run this script from the root of the CareerMentor project"
    exit 1
fi

# Check if mobile app endpoints file exists
if [ ! -f "$MOBILE_APP_ENDPOINTS_PATH" ]; then
    echo -e "${RED}Error: Cannot find mobile app endpoints file at $MOBILE_APP_ENDPOINTS_PATH${NC}"
    exit 1
fi

# Start MongoDB container
echo -e "${YELLOW}Starting MongoDB container...${NC}"
if docker ps | grep -q $MONGODB_CONTAINER_NAME; then
    echo -e "${GREEN}MongoDB container is already running.${NC}"
else
    if docker ps -a | grep -q $MONGODB_CONTAINER_NAME; then
        echo -e "${YELLOW}MongoDB container exists but is not running. Starting it...${NC}"
        docker start $MONGODB_CONTAINER_NAME
    else
        echo -e "${YELLOW}Creating and starting MongoDB container...${NC}"
        docker run -d --name $MONGODB_CONTAINER_NAME -p 27017:27017 mongo:latest
    fi
    
    # Wait a moment for MongoDB to start
    echo -e "${YELLOW}Waiting for MongoDB to start...${NC}"
    sleep 5
    
    # Check if MongoDB container is running
    if ! docker ps | grep -q $MONGODB_CONTAINER_NAME; then
        echo -e "${RED}MongoDB container failed to start.${NC}"
        exit 1
    else
        echo -e "${GREEN}MongoDB container started successfully.${NC}"
    fi
fi

# Stop and remove existing backend container if it exists
echo -e "${YELLOW}Stopping and removing existing backend container (if any)...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null
docker rm $CONTAINER_NAME 2>/dev/null

# Build the Docker image if needed
echo -e "${YELLOW}Building Docker image...${NC}"
cd $BACKEND_DIR
docker build -t $CONTAINER_NAME .

# Start the container
echo -e "${YELLOW}Starting backend container...${NC}"
docker run -d --name $CONTAINER_NAME -p 8000:8000 \
    --add-host=host.docker.internal:host-gateway \
    --link $MONGODB_CONTAINER_NAME:mongodb \
    -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
    -e ADZUNA_APP_ID=ac7d329d \
    -e ADZUNA_API_KEY=fd74aa940604de795dcd178d167fc279 \
    -e NGROK_AUTH_TOKEN=$NGROK_AUTH_TOKEN \
    -e NGROK_STATIC_DOMAIN=$NGROK_STATIC_DOMAIN \
    -e MONGODB_URI=mongodb://mongodb:27017 \
    $CONTAINER_NAME

# Using static domain for ngrok
echo -e "${YELLOW}Using static ngrok domain: $NGROK_STATIC_DOMAIN${NC}"
NGROK_URL="https://$NGROK_STATIC_DOMAIN"

# Wait a moment for the container to start
sleep 5

# Check if the container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo -e "${RED}Container failed to start. Checking logs:${NC}"
    docker logs $CONTAINER_NAME
    
    echo -e "\n${YELLOW}The backend server may not be running correctly.${NC}"
    echo -e "${YELLOW}You'll need to manually update the mobile app's API endpoints.${NC}"
    
    # Ask if user wants to continue with manual update
    read -p "Do you want to manually update the API endpoints with a custom URL? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter the URL to use (e.g., https://your-ngrok-url.ngrok-free.app): " MANUAL_URL
        NGROK_URL=$MANUAL_URL
    else
        echo -e "${RED}Exiting without updating API endpoints.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Using ngrok URL: $NGROK_URL${NC}"

# Update the mobile app's API endpoints
echo -e "${YELLOW}Updating mobile app API endpoints...${NC}"
cd ../../  # Go back to project root

# Update all ngrok URLs in the file
echo -e "${YELLOW}Updating all ngrok URLs in the file...${NC}"

# Create a backup of the original file
cp "$MOBILE_APP_ENDPOINTS_PATH" "$MOBILE_APP_ENDPOINTS_PATH.bak"

# Update the API_BASE_URL constant
sed -i '' "s|export const API_BASE_URL = '.*'|export const API_BASE_URL = '$NGROK_URL'|g" "$MOBILE_APP_ENDPOINTS_PATH"

# Add the new ngrok URL to the API_FALLBACK_URLS array (after the opening bracket)
sed -i '' "/export const API_FALLBACK_URLS = \[/a\\
  \"$NGROK_URL\",
" "$MOBILE_APP_ENDPOINTS_PATH"

echo -e "${GREEN}=== CareerMentor Setup Complete ===${NC}"
echo -e "${GREEN}MongoDB is running on: mongodb://localhost:27017${NC}"
echo -e "${GREEN}Backend API is running on: $NGROK_URL${NC}"
echo -e "${GREEN}You can now start the mobile app with: cd Agentic_AI_System/mobile-app/CareerMentor && npm start${NC}"
