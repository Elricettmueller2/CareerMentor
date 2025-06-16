from fastapi import FastAPI, Query, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Import crew functions
#from crews.mock_mate.run_mock_mate_crew import run_respond_to_answer, run_start_interview, run_review_interview
from crews.test.run_test_crew import run_test_crew

from crews.resume_refiner.run_resume_refiner_crew import (
    run_upload, run_parse, run_analyze_layout, run_evaluate, run_match
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

class JobMatchRequest(BaseModel):
    job_descriptions: List[Dict[str, Any]]

@app.get("/healthcheck", tags=["System"])
def is_healthy(test: str = Query("test", description="Enter any string as test parameter")):
    return {"message": f"Successfully extracted URL param from GET request: {test}."}

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