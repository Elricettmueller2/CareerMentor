from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import os
from dotenv import load_dotenv

# Import agents
from agents.mock_mate.agent import MockMateAgent

# Load environment variables
load_dotenv()

# Create a FastAPI app
app = FastAPI(
    title="CareerMentor API",
    description="Backend API for CareerMentor application with AI agents",
    version="0.1.0"
)

# Pydantic models for request validation
class CommandRequest(BaseModel):
    command: str

class AgentRequest(BaseModel):
    data: Dict[str, Any]
    
@app.get("/healthcheck", tags=["System"])
def is_healthy(test: str = Query("test", description="Enter any string as test parameter")):
    return {"message": f"Successfully extracted URL param from GET request: {test}."}


@app.post("/run", tags=["Application"])
def run_command(request: CommandRequest):
    command = request.command
    if command == "log":
        print("Logging to terminal...")
        return {"message": "Printing to terminal."}
    elif command == "execute":
        return {"message": "Starting the application."}
    else:
        return {"message": f"Unknown command: {command}!"}


# Agent endpoints
@app.post("/agents/mock_mate/{action}", tags=["Agents", "MockMate"])
async def mock_mate_endpoint(action: str, request: AgentRequest):
    """Route requests to the MockMate agent based on the action"""
    # Get model configuration from environment variables
    model_name = os.environ.get("DEFAULT_MODEL", "llama3.2")
    ollama_base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Initialize the agent
    agent = MockMateAgent(model_name=model_name, ollama_base_url=ollama_base_url)
    
    # Extract request data
    data = request.data
    
    # Route to the appropriate method based on action
    try:
        if action == "start_interview":
            result = agent.start_interview(
                job_role=data.get("job_role"),
                experience_level=data.get("experience_level")
            )
            return {"response": result}
            
        elif action == "respond":
            result = agent.respond_to_answer(
                job_role=data.get("job_role"),
                experience_level=data.get("experience_level"),
                interview_history=data.get("interview_history"),
                user_response=data.get("user_response")
            )
            return {"response": result}
            
        elif action == "feedback":
            result = agent.provide_feedback(
                interview_history=data.get("interview_history")
            )
            return {"response": result}
            
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")