from fastapi import FastAPI, HTTPException, Depends, Request, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Import crew functions
from crews.mock_mate.run_mock_mate_crew import run_respond_to_answer, run_start_interview, run_review_interview
from crews.track_pal.run_track_pal_crew import run_check_reminders, run_analyze_patterns, get_applications, save_application, update_application
from crews.track_pal.crew import respond
from crews.test.run_test_crew import run_test_crew
from services.session_manager import add_message_to_history

# Load environment variables
load_dotenv()

app = FastAPI(
    title="CareerMentor API",
    description="Backend API for CareerMentor application with AI agents",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "exp://localhost:8081", "*"],  # Allow requests from the mobile app
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Mount static files if needed
# app.mount("/static", StaticFiles(directory="static"), name="static")

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

@app.post("/agents/track_pal/{action}", tags=["Agents", "TrackPal"])
async def track_pal_endpoint(action: str, request: AgentRequest):
    """Route requests to the TrackPal agent based on the action"""
    data = request.data
    try:
        if action == "check_reminders":
            result = run_check_reminders(user_id=data.get("user_id"))
            return {"response": result}
        elif action == "analyze_patterns":
            result = run_analyze_patterns(user_id=data.get("user_id"))
            return {"response": result}
        elif action == "get_applications":
            applications = get_applications(user_id=data.get("user_id"))
            return {"applications": applications}
        elif action == "save_application":
            application = save_application(
                user_id=data.get("user_id"),
                application=data.get("application", {})
            )
            return {"application": application}
        elif action == "update_application":
            updated = update_application(
                user_id=data.get("user_id"),
                app_id=data.get("app_id"),
                updates=data.get("updates", {})
            )
            if updated:
                return {"application": updated}
            else:
                raise HTTPException(status_code=404, detail=f"Application not found: {data.get('app_id')}")
        elif action == "direct_test":
            message = data.get("message", "Hello, how are you?")
            response = respond(message)
            return {"response": response}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
    except Exception as e:
        import traceback
        error_msg = f"Error in mock_mate_endpoint: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

# Agent endpoints
@app.post("/agents/mock_mate/{action}", tags=["Agents", "MockMate"])
async def mock_mate_endpoint(action: str, request: AgentRequest):
    """Route requests to the MockMate agent based on the action"""
    # Extract request data
    data = request.data
    
    # Route to the appropriate method based on action
    try:
        if action == "respond":
            session_id = data.get("session_id")
            user_response = data.get("user_response")
            print(f"DEBUG: Running respond_to_answer with user_response={user_response}, session_id={session_id}")
            
            # Add user message to history
            if session_id:
                add_message_to_history(session_id, "user", user_response)
            
            result = run_respond_to_answer(
                user_respond=user_response,
                session_id=session_id
            )
            
            # Add agent response to history
            if session_id:
                add_message_to_history(session_id, "assistant", result)
                
            return {"response": result}
        elif action == "start_interview":
            job_role = data.get("job_role")
            experience_level = data.get("experience_level")
            session_id = data.get("session_id")
            print(f"DEBUG: Running start_interview with job_role={job_role}, experience_level={experience_level}, session_id={session_id}")
            
            # Initialize session if provided
            if session_id:
                # Add system message to conversation history
                add_message_to_history(session_id, "system", 
                    f"This is a mock interview for a {job_role} position at {experience_level} experience level.")
            
            result = run_start_interview(
                job_role=job_role,
                experience_level=experience_level
            )
            
            # Add agent response to history
            if session_id:
                add_message_to_history(session_id, "assistant", result)
                
            return {"response": result}
        elif action == "review":
            print(f"DEBUG: Running review_interview with interview_history={data.get('interview_history')[:100]}...")
            result = run_review_interview(
                interview_history=data.get("interview_history")
            )
            return {"response": result}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
    except Exception as e:
        import traceback
        error_msg = f"Error in mock_mate_endpoint: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/agents/test", tags=["Agents", "Test"])
async def test_agent(request: AgentRequest):
    """Test endpoint for the agent"""
    try:
        # Extract request data
        data = request.data
        
        result = run_test_crew(
            text=data.get("text")
        )
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/agents/track_pal/direct_test", tags=["Agents", "TrackPal"])
async def test_ollama_direct(request: AgentRequest):
    """Test endpoint for direct communication with Ollama"""
    try:
        # Extract request data
        data = request.data
        message = data.get("message", "Hello, how are you?")
        response = respond(message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
