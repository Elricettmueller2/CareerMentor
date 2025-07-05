#!/bin/bash
# Script zum Aktualisieren beider Container (MongoDB und Backend)

echo "=== CareerMentor Container Update ==="
echo "Stoppe und entferne beide Container..."
docker stop careermentor-backend career-mentor-mongodb
docker rm careermentor-backend career-mentor-mongodb

echo "Starte den MongoDB-Container..."
docker run -d --name career-mentor-mongodb -p 27017:27017 mongo:latest

echo "Warte 5 Sekunden, bis MongoDB initialisiert ist..."
sleep 5

echo "Baue den Backend-Container neu..."
docker build -t careermentor-backend .

echo "Starte den Backend-Container mit korrekten Umgebungsvariablen..."
docker run -d --name careermentor-backend -p 8000:8000 \
  --add-host=host.docker.internal:host-gateway \
  -e MONGO_URI=mongodb://host.docker.internal:27017 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -e ADZUNA_APP_ID=ac7d329d \
  -e ADZUNA_API_KEY=fd74aa940604de795dcd178d167fc279 \
  careermentor-backend

echo "Beide Container wurden aktualisiert und gestartet."
echo "Logs anzeigen mit: docker logs careermentor-backend"
