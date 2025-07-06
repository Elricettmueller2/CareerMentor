"""
Wrapper functions for ResumeRefinerCrew operations.

These functions provide a simplified interface to the ResumeRefinerCrew
for use in FastAPI endpoints.
"""

from typing import Dict, List, Any, Optional
from fastapi import UploadFile
from .crew import ResumeRefinerCrew

# Create a singleton instance
_crew = ResumeRefinerCrew()

def upload_and_parse_resume(upload_file: UploadFile, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Upload and parse a resume document, saving to MongoDB if user_id is provided.
    
    Args:
        upload_file: FastAPI UploadFile object
        user_id: Optional user ID for saving to MongoDB
        
    Returns:
        Dictionary with parsed resume data and upload_id
    """
    return _crew.parse_document(upload_file, user_id)

def analyze_resume_layout(upload_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyze the layout of a parsed resume, saving feedback to MongoDB if user_id is provided.
    
    Args:
        upload_id: ID of the uploaded file
        user_id: Optional user ID for saving to MongoDB
        
    Returns:
        Dictionary with layout analysis results
    """
    return _crew.analyze_layout(upload_id, user_id)

def evaluate_resume_quality(upload_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Evaluate the quality of a parsed resume, saving feedback to MongoDB if user_id is provided.
    
    Args:
        upload_id: ID of the uploaded file
        user_id: Optional user ID for saving to MongoDB
        
    Returns:
        Dictionary with quality evaluation results
    """
    return _crew.evaluate_quality(upload_id, user_id)

def match_resume_with_jobs(upload_id: str, job_descriptions: List[Dict[str, Any]], user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Match a resume against job descriptions, saving results to MongoDB if user_id is provided.
    
    Args:
        upload_id: ID of the uploaded file
        job_descriptions: List of job description dictionaries
        user_id: Optional user ID for saving to MongoDB
        
    Returns:
        List of job matches with similarity scores
    """
    return _crew.match_jobs(upload_id, job_descriptions, user_id)

def match_resume_with_saved_jobs(upload_id: str, user_id: str) -> List[Dict[str, Any]]:
    """
    Match a resume against user's saved jobs from MongoDB.
    
    Args:
        upload_id: ID of the uploaded file
        user_id: User ID for retrieving saved jobs
        
    Returns:
        List of job matches with similarity scores
    """
    return _crew.match_with_saved_jobs(upload_id, user_id)

# Legacy functions for backward compatibility
def upload_and_parse_pdf(upload_file):
    """Legacy function - use upload_and_parse_resume instead"""
    return upload_and_parse_resume(upload_file)

def analyze_pdf_layout(upload_id):
    """Legacy function - use analyze_resume_layout instead"""
    return analyze_resume_layout(upload_id)

def evaluate_pdf_quality(upload_id):
    """Legacy function - use evaluate_resume_quality instead"""
    return evaluate_resume_quality(upload_id)

def match_pdf_with_jobs(upload_id, job_descriptions):
    """Legacy function - use match_resume_with_jobs instead"""
    return match_resume_with_jobs(upload_id, job_descriptions)