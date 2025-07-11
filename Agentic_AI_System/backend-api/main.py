from fastapi import FastAPI, HTTPException, Depends, Request, Query, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from typing import Dict, Any
import os
from datetime import datetime
from dotenv import load_dotenv
from services.mongodb.client import mongo_client
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import crew functions
from crews.mock_mate.run_mock_mate_crew import run_respond_to_answer, run_start_interview, run_review_interview, run_prepare_custom_interview
from crews.track_pal.run_track_pal_crew import run_check_reminders, run_analyze_patterns, get_applications, save_application, update_application
from crews.track_pal.crew import respond
#from crews.test.run_test_crew import run_test_crew
from services.session_manager import add_message_to_history, get_conversation_history, set_session_metadata, get_session_metadata
from crews.path_finder.run_path_finder_crew import run_path_finder_crew, run_path_finder_direct
from crews.path_finder.search_path import get_job_details, get_job_recommendations, save_job, unsave_job, get_saved_jobs
from crews.resume_refiner.run_resume_refiner_crew import (
    upload_and_parse_resume as refiner_upload_and_parse,
    analyze_resume_layout as refiner_analyze_layout,
    evaluate_resume_quality as refiner_evaluate_quality,
    match_resume_with_jobs as refiner_match_jobs
)

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
class AgentRequest(BaseModel):
    data: Dict[str, Any]

class CommandRequest(BaseModel):
    command: str

class JobMatchRequest(BaseModel):
    job_descriptions: List[Dict[str, Any]]

@app.get("/healthcheck", tags=["System"])
def is_healthy(test: str = Query("test", description="Enter any string as test parameter")):
    return {"message": f"Successfully extracted URL param from GET request: {test}."}

@app.post("/agents/track_pal/{action}", tags=["Agents", "TrackPal"])
async def track_pal_endpoint(action: str, request: AgentRequest):
    """Route requests to the TrackPal agent based on the action"""
    data = request.data
    try:
        if action == "check_reminders":
            # Pass applications data if provided in the request
            result = run_check_reminders(
                user_id=data.get("user_id"),
                applications=data.get("applications")
            )
            return {"response": result}
        elif action == "analyze_patterns":
            # Pass applications data if provided in the request
            result = run_analyze_patterns(
                user_id=data.get("user_id"),
                applications=data.get("applications")
            )
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
        # Note: The direct_test endpoint has been removed from the frontend
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
    except Exception as e:
        import traceback
        error_msg = f"Error in mock_mate_endpoint: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/agents/mock_mate/{action}", tags=["Agents", "MockMate"])
async def mock_mate_endpoint(action: str, request: AgentRequest):
    """Route requests to the MockMate agent based on the action"""
    # Extract request data
    data = request.data
    
    # Route to the appropriate method based on action
    try:
        if action == "respond":
            session_id = data.get("session_id")
            user_response = data.get("user_response")  # Changed from user_respond to user_response
            print(f"DEBUG: Running respond_to_answer with user_response={user_response}, session_id={session_id}")
            
            # Add user message to history
            if session_id:
                add_message_to_history(session_id, "user", user_response)
            
            result = run_respond_to_answer(
                user_response=user_response,  # Changed parameter name
                session_id=session_id
            )
            
            # Add agent response to history
            if session_id:
                add_message_to_history(session_id, "assistant", result)
                
            return {"response": result}
        elif action == "start_interview":
            job_title = data.get("job_title", data.get("job_role"))
            experience_level = data.get("experience_level")
            interview_type = data.get("interview_type", "Technical")
            company_culture = data.get("company_culture", "Balanced")
            session_id = data.get("session_id")
            
            print(f"DEBUG: Running start_interview with job_title={job_title}, experience_level={experience_level}, interview_type={interview_type}, session_id={session_id}")
            
            # Initialize session if provided
            if session_id:
                # Store metadata in session
                set_session_metadata(session_id, "job_title", job_title)
                set_session_metadata(session_id, "experience_level", experience_level)
                set_session_metadata(session_id, "interview_type", interview_type)
                set_session_metadata(session_id, "company_culture", company_culture)
                
                # Add system message to conversation history
                add_message_to_history(session_id, "system", 
                    f"This is a mock {interview_type.lower()} interview for a {job_title} position at {experience_level} experience level.")
            
            result = run_start_interview(
                job_title=job_title,
                experience_level=experience_level,
                interview_type=interview_type,
                company_culture=company_culture
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
            interview_transcript = get_conversation_history(session_id)
            
            # Get job requirements if available
            metadata = get_session_metadata(session_id)
            job_title = metadata.get("job_title")
            job_requirements = data.get("job_requirements", {"job_title": job_title})
            
            print(f"DEBUG: Running review_interview for session_id={session_id}")

            result = run_review_interview(
                interview_transcript=interview_transcript,
                job_requirements=job_requirements
            )
            return {"response": result}
        elif action == "prepare_custom_interview":
            job_description = data.get("job_description")
            required_skills = data.get("required_skills", [])
            candidate_background = data.get("candidate_background")
            
            if not job_description:
                raise HTTPException(status_code=400, detail="'job_description' is required.")
            
            print(f"DEBUG: Running prepare_custom_interview")
            
            result = run_prepare_custom_interview(
                job_description=job_description,
                required_skills=required_skills,
                candidate_background=candidate_background
            )
            return {"response": result}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
    except Exception as e:
        import traceback
        error_msg = f"Error in mock_mate_endpoint: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# Test endpoint commented out due to missing module
# @app.post("/agents/test", tags=["Agents", "Test"])
# async def test_agent(request: AgentRequest):
#     """Test endpoint for the agent"""
#     try:
#         # Extract request data
#         data = request.data
#         
#         result = run_test_crew(
#             text=data.get("text")
#         )
#         return {"response": result}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Note: The direct_test endpoint has been removed as part of the chat feature removal

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
        
        # Speichere die Suchergebnisse in der MongoDB
        try:
            # Hole die job_searches Collection
            job_searches_collection = mongo_client.get_collection("job_searches")
            
            # Erstelle ein Dokument für die Suche
            search_document = {
                "user_id": user_id,
                "search_criteria": {
                    "job_title": job_title,
                    "degree": degree,
                    "hard_skills_rating": hard_skills_rating,
                    "soft_skills_rating": soft_skills_rating,
                    "interests": interests,
                    "limit": limit
                },
                "results": result,
                "timestamp": datetime.now()
            }
            
            # Füge das Dokument in die Collection ein
            job_searches_collection.insert_one(search_document)
            print(f"Suchergebnisse für User {user_id} in MongoDB gespeichert")
        except Exception as db_error:
            print(f"Fehler beim Speichern der Suchergebnisse in MongoDB: {str(db_error)}")
            # Wir werfen hier keine Exception, damit die API trotzdem funktioniert, auch wenn das Speichern fehlschlägt
        
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
@app.post("/resume/upload")
async def upload_resume(file: UploadFile, user_id: Optional[str] = None):
    """Upload and parse a resume document"""
    try:
        result = refiner_upload_and_parse(file, user_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error uploading resume: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/resume/layout/{upload_id}")
async def analyze_resume_layout(upload_id: str, user_id: Optional[str] = None):
    """Analyze the layout of a parsed resume"""
    try:
        result = refiner_analyze_layout(upload_id, user_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error analyzing resume layout: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/resume/evaluate/{upload_id}")
async def evaluate_resume(upload_id: str, user_id: Optional[str] = None):
    """Evaluate the quality of a parsed resume"""
    try:
        result = refiner_evaluate_quality(upload_id, user_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error evaluating resume: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/resume/match/{upload_id}")
async def match_resume_with_jobs(upload_id: str, job_descriptions: List[Dict[str, Any]], user_id: Optional[str] = None):
    """Match a resume against job descriptions"""
    try:
        result = refiner_match_jobs(upload_id, job_descriptions, user_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error matching resume with jobs: {str(e)}")
        return {"status": "error", "message": str(e)}

# Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

@app.get("/resume/match-saved-jobs/{upload_id}/{user_id}")
async def match_resume_with_saved_jobs(upload_id: str, user_id: str):
    """Match a resume against user's saved jobs from MongoDB"""
    try:
        # Get saved jobs and extract the list from the dictionary
        saved_jobs_result = get_saved_jobs(user_id)
        saved_jobs_list = saved_jobs_result.get("saved_jobs", [])
        
        # Log the number of saved jobs found
        logger.info(f"Found {len(saved_jobs_list)} saved jobs for user {user_id}")
        
        # Match the resume with the saved jobs list
        result = refiner_match_jobs(upload_id, saved_jobs_list, user_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error matching resume with saved jobs: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/resume/get/{user_id}/{upload_id}")
async def get_resume_data(user_id: str, upload_id: str):
    """Get a parsed resume from MongoDB"""
    try:
        from services.mongodb.mongodb_resume_utils import get_parsed_resume
        result = get_parsed_resume(user_id, upload_id)
        if result:
            return {"status": "success", "data": result}
        else:
            return {"status": "error", "message": "Resume not found"}
    except Exception as e:
        logger.error(f"Error getting resume data: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/resume/get-matches/{user_id}/{upload_id}")
async def get_resume_job_matches(user_id: str, upload_id: str, job_id: Optional[str] = None):
    """Get job matching results for a resume"""
    try:
        from services.mongodb.mongodb_resume_utils import get_job_matching_results
        result = get_job_matching_results(user_id, upload_id, job_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error getting resume job matches: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/resume/saved-jobs/{user_id}")
async def resume_refiner_get_saved_jobs(user_id: str = "default_user"):
    """Get saved jobs for a user in a format suitable for ResumeRefiner"""
    try:
        # Get saved jobs from MongoDB
        from services.mongodb.mongodb_resume_utils import get_saved_jobs_for_matching
        
        # Get formatted jobs for matching
        saved_jobs = get_saved_jobs_for_matching(user_id)
        
        return {
            "status": "success", 
            "data": saved_jobs,
            "count": len(saved_jobs)
        }
    except Exception as e:
        logger.error(f"Error getting saved jobs for ResumeRefiner: {str(e)}")
        return {"status": "error", "message": str(e)}

# Legacy Resume Refiner endpoints for mobile app compatibility
@app.post("/resumes/upload", tags=["ResumeRefiner"])
async def legacy_upload_resume(file: UploadFile = File(...), user_id: Optional[str] = None):
    """Legacy endpoint for uploading a resume PDF or image (JPEG, PNG, HEIC)"""
    try:
        # Check if the file is a supported type (PDF, JPEG, PNG, HEIC)
        content_type = file.content_type.lower() if file.content_type else ""
        filename = file.filename.lower() if file.filename else ""
        
        is_pdf = "pdf" in content_type or filename.endswith(".pdf")
        is_jpeg = any(img_type in content_type for img_type in ["jpeg", "jpg"]) or filename.endswith((".jpg", ".jpeg"))
        is_png = "png" in content_type or filename.endswith(".png")
        is_heic = "heic" in content_type or filename.endswith(".heic")
        
        if not (is_pdf or is_jpeg or is_png or is_heic):
            raise HTTPException(400, "Only PDF, JPEG, PNG, and HEIC files are supported")
        
        # Use default user ID if none provided
        effective_user_id = user_id if user_id else "default_user"
        
        # Use our new implementation but format the response to match the old format
        result = refiner_upload_and_parse(file, effective_user_id)
        return {"upload_id": result["upload_id"]}
    except Exception as e:
        logger.error(f"Error in legacy_upload_resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.get("/resumes/{upload_id}/layout", tags=["ResumeRefiner"])
async def legacy_analyze_layout(upload_id: str):
    """Legacy endpoint for analyzing the layout of a resume PDF"""
    try:
        result = refiner_analyze_layout(upload_id)
        return {"response": result}
    except FileNotFoundError:
        raise HTTPException(404, f"Resume with ID {upload_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing layout: {str(e)}")

@app.get("/resumes/{upload_id}/parse", tags=["ResumeRefiner"])
async def legacy_parse_resume(upload_id: str):
    """Legacy endpoint for parsing a resume PDF and extracting sections"""
    try:
        # Get the parsed data from our new implementation
        from services.mongodb.mongodb_resume_utils import get_parsed_resume
        
        # First try to get it from MongoDB if it was saved there
        result = get_parsed_resume("test_user", upload_id)
        
        # If not found in MongoDB, parse it directly
        if not result or "parsed_data" not in result:
            # Get the parsed data directly from the parser
            crew = ResumeRefinerCrew()
            result = {"parsed_data": crew.parser.parse_with_sections(upload_id)}
            
        return {"response": result["parsed_data"]}
    except FileNotFoundError:
        raise HTTPException(404, f"Resume with ID {upload_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

@app.get("/resumes/{upload_id}/evaluate", tags=["ResumeRefiner"])
async def legacy_evaluate_quality(upload_id: str):
    """Legacy endpoint for evaluating the quality of a resume"""
    try:
        result = refiner_evaluate_quality(upload_id)
        return {"response": result}
    except FileNotFoundError:
        raise HTTPException(404, f"Resume with ID {upload_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluating resume: {str(e)}")

@app.post("/resumes/{upload_id}/match", tags=["ResumeRefiner"])
async def legacy_match_with_jobs(upload_id: str, job_descriptions: List[Dict[str, Any]]):
    """Legacy endpoint for matching a resume with job descriptions"""
    try:
        result = refiner_match_jobs(upload_id, job_descriptions)
        return {"response": result}
    except FileNotFoundError:
        raise HTTPException(404, f"Resume with ID {upload_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error matching resume with jobs: {str(e)}")

# Legacy endpoints for backward compatibility
@app.post("/resume/upload-pdf")
async def upload_pdf(file: UploadFile):
    """Legacy endpoint - use /resume/upload instead"""
    try:
        result = refiner_upload_and_parse(file)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error uploading PDF: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/resume/analyze-layout/{upload_id}")
async def analyze_pdf_layout(upload_id: str):
    """Legacy endpoint - use /resume/layout instead"""
    try:
        result = refiner_analyze_layout(upload_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error analyzing PDF layout: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/resume/evaluate-pdf/{upload_id}")
async def evaluate_pdf(upload_id: str):
    """Legacy endpoint - use /resume/evaluate instead"""
    try:
        result = refiner_evaluate_quality(upload_id)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error evaluating PDF: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/resume/match-pdf/{upload_id}")
async def match_pdf(upload_id: str, job_descriptions: List[Dict[str, Any]]):
    """Legacy endpoint - use /resume/match instead"""
    try:
        result = refiner_match_jobs(upload_id, job_descriptions)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error matching PDF: {str(e)}")
        return {"status": "error", "message": str(e)}

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
