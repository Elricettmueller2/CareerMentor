from fastapi import FastAPI, HTTPException, Depends, Request, Query, UploadFile, File
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
from services.session_manager import add_message_to_history, get_conversation_history
from crews.path_finder.run_path_finder_crew import run_path_finder_crew, run_path_finder_direct
from crews.path_finder.search_path import get_job_details, get_job_recommendations, save_job, unsave_job, get_saved_jobs
from crews.resume_refiner.run_resume_refiner_crew import (
    run_upload, run_parse, run_analyze_layout, run_evaluate, run_match
)

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
class AgentRequest(BaseModel):
    data: Dict[str, Any]

class CommandRequest(BaseModel):
    command: str

class JobMatchRequest(BaseModel):
    job_descriptions: List[Dict[str, Any]]

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
            session_id = data.get("session_id")
            if not session_id:
                raise HTTPException(status_code=400, detail="'session_id' is required.")

            # Get conversation history from session
            interview_history = get_conversation_history(session_id)
            print(f"DEBUG: Running review_interview for session_id={session_id}")

            result = run_review_interview(
                interview_history=interview_history
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

#Resume Refiner Agent Endpoints
@app.post("/resumes/upload", tags=["ResumeRefiner"])
async def upload_resume(file: UploadFile = File(...)):
    """Upload a resume PDF and get an upload_id"""
    print("🖨️ upload_resume called")
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are supported")
    
    try:
        # Debug logging to inspect the file
        print(f"📄 File received: name={file.filename}, content_type={file.content_type}")
        
        # Check file position - Note: file.file.tell() is not an async method
        position = file.file.tell()
        print(f"📄 Initial file position: {position}")
        
        # Try to read a small chunk to check if file has content
        # Note: seek() is not an async method on the underlying file object
        file.file.seek(0)
        # But read() might be async depending on the implementation
        chunk = await file.read(1024)  # Read first 1KB
        chunk_size = len(chunk)
        print(f"📄 First chunk size: {chunk_size} bytes")
        
        # Important: Reset file position for subsequent reads
        file.file.seek(0)
        
        # Check if SpooledTemporaryFile was created (if using SpooledTemporaryFile)
        if hasattr(file, 'file') and hasattr(file.file, '_file'):
            print(f"📄 File is spooled: {file.file._file is not None}")
        
        upload_id = run_upload(file)
        return {"upload_id": upload_id}
    except Exception as e:
        print(f"❌ Error in upload_resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


@app.get("/resumes/{upload_id}/layout", tags=["ResumeRefiner"])
async def analyze_layout(upload_id: str):
    """Analyze the layout of a resume PDF"""
    try:
        result = run_analyze_layout(upload_id)
        return {"response": result}
    except FileNotFoundError:
        raise HTTPException(404, f"Resume with ID {upload_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing layout: {str(e)}")


@app.get("/resumes/{upload_id}/parse", tags=["ResumeRefiner"])
async def parse_resume(upload_id: str):
    """Parse a resume PDF and extract sections"""
    try:
        result = run_parse(upload_id)
        return {"response": result}
    except FileNotFoundError:
        raise HTTPException(404, f"Resume with ID {upload_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")


@app.get("/resumes/{upload_id}/evaluate", tags=["ResumeRefiner"])
async def evaluate_resume(upload_id: str):
    """Evaluate resume quality with layout analysis"""
    try:
        result = run_evaluate(upload_id)
        return {"response": result}
    except FileNotFoundError:
        raise HTTPException(404, f"Resume with ID {upload_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluating resume: {str(e)}")


@app.post("/resumes/{upload_id}/match", tags=["ResumeRefiner"])
async def match_resume(upload_id: str, request: JobMatchRequest):
    """Match resume against job descriptions"""
    try:
        result = run_match(upload_id, request.job_descriptions)
        return {"response": result}
    except FileNotFoundError:
        raise HTTPException(404, f"Resume with ID {upload_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error matching resume: {str(e)}")


# Legacy endpoints for backward compatibility
@app.post("/agents/resume_refiner/parse", tags=["ResumeRefiner", "Legacy"])
async def legacy_parse_resume(request: AgentRequest):
    """Legacy endpoint for parsing resumes"""
    uid = request.data.get("upload_id")
    if not uid:
        raise HTTPException(400, "upload_id is required")
    try:
        result = run_parse(uid)
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


@app.post("/agents/resume_refiner/refine/{upload_id}", tags=["ResumeRefiner", "Legacy"])
async def legacy_refine_resume(upload_id: str):
    """Legacy endpoint for refining resumes"""
    try:
        result = run_evaluate(upload_id)
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")


@app.post("/agents/resume_refiner/match/{upload_id}", tags=["ResumeRefiner", "Legacy"])
async def legacy_match_resume(upload_id: str, request: dict):
    """Legacy endpoint for matching resumes"""
    job_text = request.get("data", {}).get("job_text")
    if not job_text:
        raise HTTPException(400, "job_text is required")
    try:
        result = run_match(upload_id, job_text)
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Global State endpoints
@app.get("/global-state", tags=["GlobalState"])
async def get_global_state():
    """Get the global state"""
    from services.mongodb.sync_service import sync_service
    result = sync_service.get_backend_state()
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=500, detail=result["message"])

# Pydantic models for global state requests
class GlobalStateRequest(BaseModel):
    state: Dict[str, Any]

class KnowledgeUpdateRequest(BaseModel):
    key: str
    value: Any

@app.post("/global-state/sync", tags=["GlobalState"])
async def sync_global_state(request: GlobalStateRequest):
    """Sync the global state between frontend and backend"""
    from services.mongodb.sync_service import sync_service
    result = sync_service.sync_from_frontend(request.state)
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=500, detail=result["message"])

@app.post("/global-state/knowledge", tags=["GlobalState"])
async def update_knowledge(request: KnowledgeUpdateRequest):
    """Update a specific knowledge item in the global state"""
    from services.mongodb.sync_service import sync_service
    result = sync_service.update_knowledge(request.key, request.value)
    if result["success"]:
        return result
    else:
        raise HTTPException(status_code=500, detail=result["message"])
