# CareerDaddy

CareerDaddy is an AI-powered career development platform that helps users navigate their professional journey through specialized AI agents. The platform offers mock interviews, career path recommendations, resume refinement, and application tracking in a mobile-friendly interface.

## 🌟 Features

- **MockMate**: AI-powered interview simulation with real-time feedback and comprehensive review
- **PathFinder**: Career path recommendations and job search assistance
- **ResumeRefiner**: Resume analysis, improvement suggestions, and job matching
- **TrackPal**: Application tracking and reminder system

## 🏗️ Architecture

CareerDaddy follows an agent-based architecture using CrewAI:

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   Mobile App    │◄────┤   Backend API   │
│  (React Native) │     │    (FastAPI)    │
│                 │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │                 │
                        │   AI Agents     │
                        │   (CrewAI)      │
                        │                 │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │                 │
                        │  Local LLM      │
                        │  (Ollama)       │
                        │                 │
                        └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Ollama](https://ollama.ai/download) (for local LLM support)
- [Node.js](https://nodejs.org/) (for mobile app development)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (for mobile app development)
- [Python 3.11+](https://www.python.org/downloads/) (for backend development)
- [Poetry](https://python-poetry.org/docs/) (for Python dependency management)

### Backend Setup

#### Option 1: Using Docker (Recommended)

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

#### Option 3: Quick Setup Script

A shell script for instant setup is there. This script does automate the entire backend setup process, including environment configuration, dependency installation, and service startup.

to use it run:

```bash
./setup.sh
```

#### Option 2: Local Development Setup

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

### Mobile App Setup

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

## 📚 API Documentation

The backend API exposes the following endpoints:

### System Endpoints
- `GET /healthcheck`: Check if the API is running

### MockMate (Interview Simulation)
- `POST /agents/mock_mate/start_interview`: Start a mock interview
- `POST /agents/mock_mate/respond`: Get a response to a user answer
- `POST /agents/mock_mate/review`: Get a review of the interview

### PathFinder (Career Path Recommendations)
- `POST /agents/path_finder/suggest_roles`: Get job search term suggestions
- `POST /agents/path_finder/search_jobs`: Search for jobs matching criteria
- `GET /agents/path_finder/job/{job_id}`: Get details of a specific job
- `GET /agents/path_finder/analyze/{job_id}`: Analyze job requirements
- `POST /agents/path_finder/compare_skills`: Compare user skills with job requirements
- `POST /agents/path_finder/recommend`: Get job recommendations

### ResumeRefiner (Resume Analysis)
- `POST /resumes/upload`: Upload a resume PDF
- `GET /resumes/{upload_id}/layout`: Analyze resume layout
- `GET /resumes/{upload_id}/parse`: Parse resume and extract sections
- `GET /resumes/{upload_id}/evaluate`: Evaluate resume quality
- `POST /resumes/{upload_id}/match`: Match resume against job descriptions

### TrackPal (Application Tracking)
- `POST /agents/track_pal/check_reminders`: Check application reminders
- `POST /agents/track_pal/analyze_patterns`: Analyze application patterns
- `POST /agents/track_pal/get_applications`: Get user applications
- `POST /agents/track_pal/save_application`: Save a new application
- `POST /agents/track_pal/update_application`: Update an existing application

## 🤖 Agent System Architecture

The backend implements multiple AI agents, each with specific capabilities:

| Agent | Purpose | Status |
|-------|---------|--------|
| MockMate | Interview simulation | Implemented |
| PathFinder | Career path recommendations | Implemented |
| ResumeRefiner | Resume improvement suggestions | Implemented |
| TrackPal | Learning track recommendations | Implemented |

## 💻 Technical Stack

### Backend

- **Framework**: FastAPI
- **Agent Framework**: CrewAI
- **Language Model**: Ollama with Llama 3.2
- **Database**: MongoDB
- **Key Dependencies**:
  - `crewai`: Framework for building AI agent systems
  - `langchain`: Framework for LLM applications
  - `PyMuPDF`: PDF processing library
  - `easyocr`: Optical character recognition
  - `sentence-transformers`: Text embeddings for semantic search
  - `keybert`: Keyword extraction from text

### Mobile App

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Key Dependencies**:
  - `expo`: React Native framework
  - `axios`: HTTP client for API requests
  - `expo-document-picker`: Document selection for resume uploads
  - `@react-native-async-storage/async-storage`: Local data persistence
  - `@react-native-community/datetimepicker`: Date and time selection

## 🔧 Development

### Docker Development Workflow

For a more efficient development workflow, you can mount your local code directory as a volume:

```bash
docker run -p 8000:8000 --env-file .env -v $(pwd):/app --name careermentor-api careermentor-backend
```

This allows you to make changes to the code without rebuilding the Docker image.

### Contributing

When contributing to the project, please follow these guidelines:

1. Create a feature branch from `development`
2. Make your changes and test thoroughly
3. Submit a pull request to merge back into `development`
4. Once approved, changes will be merged into `master` for releases

## 🔍 Troubleshooting

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

### Common Docker Issues

If you encounter issues with Docker, here are some helpful commands:

```bash
# Check running containers
docker ps

# Stop a running container
docker stop career-mentor-backend-container

# Remove a container
docker rm career-mentor-backend-container

# Build the image with a specific path
docker build -t career-mentor-backend:latest /path/to/backend-api

# Run container in detached mode
docker run -d -p 8000:8000 --name career-mentor-backend-container career-mentor-backend:latest

# Check container logs
docker logs career-mentor-backend-container
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- [Elric Ettmüller](https://github.com/Elricettmueller2)
- [Azim Alizada](https://github.com/Azim-Alizada)
- [Maximilian Weicht](https://github.com/MaximilianWeicht)
- [Alessandro Fisslinger](https://github.com/1BobFTW1)
