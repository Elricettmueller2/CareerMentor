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
from crews.path_finder.run_path_finder_crew import run_path_finder_crew, run_path_finder_direct
from crews.path_finder.search_path import get_job_details, get_job_recommendations, save_job, unsave_job, get_saved_jobs

# Import database initialization
from database.init_db import init_database

# Load environment variables
load_dotenv()

# Initialize the database
init_database()

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
# Path Finder endpoints
@app.post("/agents/path_finder/suggest_roles", tags=["Agents", "PathFinder"])
async def path_finder_suggest_roles(request: AgentRequest):
    """Get job search term suggestions based on partial input"""
    try:
        query = request.data.get("query", "")
        if len(query) < 2:
            return {"suggestions": []}
            
        result = suggest_roles(query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/agents/path_finder/search_jobs_online", tags=["Agents", "PathFinder"])
async def path_finder_search_jobs(request: AgentRequest):
    """Search for jobs matching the detailed criteria"""
    try:
        # Extrahiere alle detaillierten Suchkriterien aus dem Request
        job_title = request.data.get("job_title", "")
        degree = request.data.get("degree", "")
        hard_skills_rating = request.data.get("hard_skills_rating", 5)
        soft_skills_rating = request.data.get("soft_skills_rating", 5)
        interests = request.data.get("interests", "")
        limit = request.data.get("limit", 10)
        user_id = request.data.get("user_id", "default_user")
        
        # Stelle sicher, dass mindestens ein Suchkriterium angegeben ist
        if not job_title and not degree and not interests:
            raise HTTPException(status_code=400, detail="Mindestens ein Suchkriterium (Job-Titel, Abschluss oder Interessen) muss angegeben werden")
            
        # Rufe die crewAI-Suchfunktion mit allen Parametern auf
        result = run_path_finder_direct(
            job_title=job_title,
            degree=degree,
            hard_skills_rating=hard_skills_rating,
            soft_skills_rating=soft_skills_rating,
            interest_points=interests,
            user_id=user_id,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/agents/path_finder/job/{job_id}", tags=["Agents", "PathFinder"])
async def path_finder_get_job(job_id: str, user_id: str = "default_user"):
    """Get details of a specific job"""
    try:
        result = get_job_details(job_id, user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving job details: {str(e)}")

@app.get("/agents/path_finder/analyze-job/{job_id}", tags=["Agents", "PathFinder"])
async def path_finder_analyze_job(job_id: str):
    """Analyze requirements and qualifications for a specific job posting"""
    try:
        # Verwende die neue Path Finder Crew-Funktion
        job_data = {"job_id": job_id}
        result = run_path_finder_direct(job_title="Analyze Job", education_level="", years_experience=0, location_radius=0, interest_points="", job_data=job_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing job requirements: {str(e)}")

@app.post("/agents/path_finder/compare-skills", tags=["Agents", "PathFinder"])
async def path_finder_compare_skills(request: AgentRequest):
    """Compare user skills with job requirements and provide match analysis"""
    try:
        user_profile = request.data.get("user_profile", {})
        job_ids = request.data.get("job_ids", [])
        
        if not user_profile:
            raise HTTPException(status_code=400, detail="User profile is required")
        if not job_ids:
            raise HTTPException(status_code=400, detail="At least one job ID is required")
            
        # Verwende die neue Path Finder Crew-Funktion
        job_data = {"user_profile": user_profile, "job_ids": job_ids}
        result = run_path_finder_direct(job_title="Compare Skills", education_level="", years_experience=0, location_radius=0, interest_points="", job_data=job_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing skills to jobs: {str(e)}")

@app.post("/agents/path_finder/recommend", tags=["Agents", "PathFinder"])
async def path_finder_recommend_jobs(request: AgentRequest):
    """Get job recommendations based on user's search history"""
    try:
        user_id = request.data.get("user_id", "default_user")
        limit = request.data.get("limit", 3)
        
        result = get_job_recommendations(user_id, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Add endpoint for saving jobs
@app.post("/agents/path_finder/save_job", tags=["Agents", "PathFinder"])
async def path_finder_save_job(request: AgentRequest):
    """Save a job for a user"""
    try:
        user_id = request.data.get("user_id", "default_user")
        job_data = request.data.get("job_data")
        
        if not job_data:
            raise HTTPException(status_code=400, detail="Job data is required")
            
        result = save_job(user_id, job_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Add endpoint for unsaving jobs
@app.post("/agents/path_finder/unsave_job", tags=["Agents", "PathFinder"])
async def path_finder_unsave_job(request: AgentRequest):
    """Remove a saved job for a user"""
    try:
        user_id = request.data.get("user_id", "default_user")
        job_id = request.data.get("job_id")
        
        if not job_id:
            raise HTTPException(status_code=400, detail="Job ID is required")
            
        result = unsave_job(user_id, job_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Add endpoint for retrieving saved jobs
@app.get("/agents/path_finder/saved_jobs/{user_id}", tags=["Agents", "PathFinder"])
async def path_finder_get_saved_jobs(user_id: str = "default_user"):
    """Get saved jobs for a user"""
    try:
        result = get_saved_jobs(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
