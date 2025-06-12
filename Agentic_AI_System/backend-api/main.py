from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from pydantic import BaseModel
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Import crew functions
#from crews.mock_mate.run_mock_mate_crew import run_respond_to_answer, run_start_interview, run_review_interview
from crews.test.run_test_crew import run_test_crew

# Load environment variables
load_dotenv()

app = FastAPI(
    title="CareerMentor API",
    description="Backend API for CareerMentor application with AI agents",
    version="0.1.0"
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

# Agent endpoints
# @app.post("/agents/mock_mate/{action}", tags=["Agents", "MockMate"])
# async def mock_mate_endpoint(action: str, request: AgentRequest):
#     Route requests to the MockMate agent based on the action
#     # Extract request data
#     data = request.data
#     
#     # Route to the appropriate method based on action
#     try:
#         if action == "respond":
#             result = run_respond_to_answer(
#                 user_response=data.get("user_response")
#             )
#             return {"response": result}
#         elif action == "start_interview":
#             result = run_start_interview(
#                 job_role=data.get("job_role"),
#                 experience_level=data.get("experience_level")
#             )
#             return {"response": result}
#         elif action == "review":
#             result = run_review_interview(
#                 interview_history=data.get("interview_history")
#             )
#             return {"response": result}
#         else:
#             raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
#             
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/agents/test", tags=["Agents", "Test"])
async def test_endpoint(request: AgentRequest):
    """Route requests to the Test agent"""
    # Extract request data
    data = request.data
    
    try:
        result = run_test_crew(
            text=data.get("text")
        )
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
