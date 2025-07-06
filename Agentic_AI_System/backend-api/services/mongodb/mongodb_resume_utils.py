"""
MongoDB utilities for resume-related operations in CareerMentor

This module provides functions for interacting with MongoDB collections
related to resume parsing, evaluation, and job matching.
"""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from services.mongodb.global_state_service import global_state

def save_parsed_resume(user_id: str, upload_id: str, resume_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save a parsed resume to MongoDB
    
    Args:
        user_id: The user ID
        upload_id: The upload ID of the resume
        resume_data: The parsed resume data
        
    Returns:
        The saved resume data
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Format the resume data with metadata
    formatted_resume = {
        "upload_id": upload_id,
        "parsed_data": resume_data,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    # Update the user state
    if "agent_knowledge" not in user_state:
        user_state["agent_knowledge"] = {}
    
    if "resume" not in user_state["agent_knowledge"]:
        user_state["agent_knowledge"]["resume"] = {
            "current_resume_id": None,
            "resumes": {}
        }
    
    # Set as current resume
    user_state["agent_knowledge"]["resume"]["current_resume_id"] = upload_id
    
    # Save the resume data
    user_state["agent_knowledge"]["resume"]["resumes"][upload_id] = formatted_resume
    
    # Update the state
    global_state.set_state(user_state, user_id)
    
    return formatted_resume

def get_parsed_resume(user_id: str, upload_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a parsed resume from MongoDB
    
    Args:
        user_id: The user ID
        upload_id: The upload ID of the resume
        
    Returns:
        The parsed resume data or None if not found
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Check if resume exists
    if "agent_knowledge" in user_state and \
       "resume" in user_state["agent_knowledge"] and \
       "resumes" in user_state["agent_knowledge"]["resume"] and \
       upload_id in user_state["agent_knowledge"]["resume"]["resumes"]:
        return user_state["agent_knowledge"]["resume"]["resumes"][upload_id]
    
    return None

def save_resume_feedback(user_id: str, upload_id: str, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save feedback for a resume
    
    Args:
        user_id: The user ID
        upload_id: The upload ID of the resume
        feedback_data: The feedback data
        
    Returns:
        The updated resume data
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Check if resume exists
    if "agent_knowledge" not in user_state or \
       "resume" not in user_state["agent_knowledge"] or \
       "resumes" not in user_state["agent_knowledge"]["resume"] or \
       upload_id not in user_state["agent_knowledge"]["resume"]["resumes"]:
        # Resume doesn't exist, create a new entry
        resume_data = {
            "upload_id": upload_id,
            "parsed_data": {},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Ensure the structure exists
        if "agent_knowledge" not in user_state:
            user_state["agent_knowledge"] = {}
        
        if "resume" not in user_state["agent_knowledge"]:
            user_state["agent_knowledge"]["resume"] = {
                "current_resume_id": None,
                "resumes": {}
            }
        
        user_state["agent_knowledge"]["resume"]["resumes"][upload_id] = resume_data
    
    # Add feedback to the resume
    user_state["agent_knowledge"]["resume"]["resumes"][upload_id]["feedback"] = feedback_data
    user_state["agent_knowledge"]["resume"]["resumes"][upload_id]["updated_at"] = datetime.now().isoformat()
    
    # Update the state
    global_state.set_state(user_state, user_id)
    
    return user_state["agent_knowledge"]["resume"]["resumes"][upload_id]

def save_job_matching_results(user_id: str, upload_id: str, job_id: str, matching_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save job matching results for a resume
    
    Args:
        user_id: The user ID
        upload_id: The upload ID of the resume
        job_id: The job ID
        matching_data: The matching data
        
    Returns:
        The updated resume data
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Check if resume exists
    if "agent_knowledge" not in user_state or \
       "resume" not in user_state["agent_knowledge"] or \
       "resumes" not in user_state["agent_knowledge"]["resume"] or \
       upload_id not in user_state["agent_knowledge"]["resume"]["resumes"]:
        # Resume doesn't exist, create a new entry
        resume_data = {
            "upload_id": upload_id,
            "parsed_data": {},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "job_matches": {}
        }
        
        # Ensure the structure exists
        if "agent_knowledge" not in user_state:
            user_state["agent_knowledge"] = {}
        
        if "resume" not in user_state["agent_knowledge"]:
            user_state["agent_knowledge"]["resume"] = {
                "current_resume_id": None,
                "resumes": {}
            }
        
        user_state["agent_knowledge"]["resume"]["resumes"][upload_id] = resume_data
    
    # Initialize job_matches if it doesn't exist
    if "job_matches" not in user_state["agent_knowledge"]["resume"]["resumes"][upload_id]:
        user_state["agent_knowledge"]["resume"]["resumes"][upload_id]["job_matches"] = {}
    
    # Add job matching data
    user_state["agent_knowledge"]["resume"]["resumes"][upload_id]["job_matches"][job_id] = {
        "matching_data": matching_data,
        "matched_at": datetime.now().isoformat()
    }
    
    user_state["agent_knowledge"]["resume"]["resumes"][upload_id]["updated_at"] = datetime.now().isoformat()
    
    # Update the state
    global_state.set_state(user_state, user_id)
    
    return user_state["agent_knowledge"]["resume"]["resumes"][upload_id]

def get_job_matching_results(user_id: str, upload_id: str, job_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get job matching results for a resume
    
    Args:
        user_id: The user ID
        upload_id: The upload ID of the resume
        job_id: Optional job ID to get specific matching results
        
    Returns:
        Dictionary of job matching results
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Check if resume exists
    if "agent_knowledge" not in user_state or \
       "resume" not in user_state["agent_knowledge"] or \
       "resumes" not in user_state["agent_knowledge"]["resume"] or \
       upload_id not in user_state["agent_knowledge"]["resume"]["resumes"] or \
       "job_matches" not in user_state["agent_knowledge"]["resume"]["resumes"][upload_id]:
        return {}
    
    # Get all job matches or specific job match
    job_matches = user_state["agent_knowledge"]["resume"]["resumes"][upload_id]["job_matches"]
    
    if job_id:
        return {job_id: job_matches.get(job_id, {})}
    
    return job_matches

def get_saved_jobs_for_matching(user_id: str) -> List[Dict[str, Any]]:
    """
    Get saved jobs for a user to use in job matching
    
    Args:
        user_id: The user ID
        
    Returns:
        List of saved jobs formatted for job matching
    """
    from services.mongodb.mongodb_pathfinder_utils import get_saved_jobs_for_user
    
    # Get saved jobs
    saved_jobs = get_saved_jobs_for_user(user_id)
    
    # Format jobs for matching
    formatted_jobs = []
    for job in saved_jobs:
        formatted_job = {
            "id": job.get("id", ""),
            "title": job.get("position", ""),
            "company": job.get("company", ""),
            "location": job.get("location", ""),
            "description": job.get("description", ""),
            "requirements": job.get("requirements", ""),
            "skills": job.get("skills", [])
        }
        
        # Combine description and requirements if needed
        if formatted_job["description"] and formatted_job["requirements"]:
            formatted_job["description"] = f"{formatted_job['description']}\n\nRequirements:\n{formatted_job['requirements']}"
        
        formatted_jobs.append(formatted_job)
    
    return formatted_jobs
