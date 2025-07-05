#!/bin/bash
# Script zum Aktualisieren des Backend-Containers nach Code-Änderungen

echo "=== CareerMentor Backend Update ==="
echo "Stoppe und entferne den Backend-Container..."
docker stop careermentor-backend
docker rm careermentor-backend

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

echo "Backend-Container wurde aktualisiert und gestartet."
echo "Logs anzeigen mit: docker logs careermentor-backend"
