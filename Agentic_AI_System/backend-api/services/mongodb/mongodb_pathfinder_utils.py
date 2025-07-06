"""
MongoDB utilities for job-related operations in CareerMentor

This module provides functions for interacting with MongoDB collections
related to job search, saved jobs, and search history.
"""

import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
from pymongo.database import Database
from pymongo.collection import Collection

from services.mongodb.global_state_service import global_state

def save_job_for_user(user_id: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save a job for a user in MongoDB
    
    Args:
        user_id: The user ID
        job_data: The job data to save
        
    Returns:
        The saved job data
    """
    # Format the job data according to our schema
    # Ensure we have a valid created_at date
    current_time = datetime.now().isoformat()
    
    formatted_job = {
        "id": job_data.get("id", str(uuid.uuid4())),
        "position": job_data.get("position", job_data.get("title", "Unknown Title")),
        "company": job_data.get("company", "Unknown Company"),
        "location": job_data.get("location", ""),
        "application_link": job_data.get("application_link", ""),
        "description": job_data.get("description", ""),
        "match_score": job_data.get("match_score", 0),
        "distance": job_data.get("distance", 0),
        "education_required": job_data.get("education_required", ""),
        "experience_required": job_data.get("experience_required", 0),
        "salary": job_data.get("salary", ""),
        "skills": job_data.get("skills", []),
        "requirements": job_data.get("requirements", ""),
        "source": job_data.get("source", "PathFinder"),  # Changed default from Adzuna to PathFinder
        "status": job_data.get("status", "saved"),  # Set a default status
        "days_since_applied": job_data.get("days_since_applied", ""),
        "days_until_followup": job_data.get("days_until_followup", ""),
        "notes": job_data.get("notes", ""),
        "application_status": job_data.get("application_status", "not applied"),
        "created_at": job_data.get("created_at", current_time),  # Use provided date or current time
        "updated_at": current_time
    }
    
    # Check if the job is already saved
    user_state = global_state.get_state(user_id)
    
    # Find the job in saved_jobs if it exists
    saved_jobs = user_state.get("agent_knowledge", {}).get("job_search", {}).get("saved_jobs", [])
    
    # Check if job already exists
    for i, job in enumerate(saved_jobs):
        if job.get("id") == formatted_job["id"]:
            # Job already exists, return it
            return job
    
    # Job doesn't exist, add it to saved_jobs
    saved_jobs.append(formatted_job)
    
    # Update the user state
    user_state["agent_knowledge"]["job_search"]["saved_jobs"] = saved_jobs
    global_state.set_state(user_state, user_id)
    
    return formatted_job

def unsave_job_for_user(user_id: str, job_id: str) -> bool:
    """
    Remove a saved job for a user
    
    Args:
        user_id: The user ID
        job_id: The job ID to remove
        
    Returns:
        True if the job was removed, False otherwise
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Get saved jobs
    saved_jobs = user_state.get("agent_knowledge", {}).get("job_search", {}).get("saved_jobs", [])
    
    # Find the job index
    job_index = None
    for i, job in enumerate(saved_jobs):
        if job.get("id") == job_id:
            job_index = i
            break
    
    # If job not found, return False
    if job_index is None:
        return False
    
    # Remove the job
    saved_jobs.pop(job_index)
    
    # Update the user state
    user_state["agent_knowledge"]["job_search"]["saved_jobs"] = saved_jobs
    global_state.set_state(user_state, user_id)
    
    return True

def get_saved_jobs_for_user(user_id: str) -> List[Dict[str, Any]]:
    """
    Get all saved jobs for a user
    
    Args:
        user_id: The user ID
        
    Returns:
        List of saved job data
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Get saved jobs
    saved_jobs = user_state.get("agent_knowledge", {}).get("job_search", {}).get("saved_jobs", [])
    
    return saved_jobs

def add_search_history(user_id: str, query: str) -> Dict[str, Any]:
    """
    Add a search query to a user's search history
    
    Args:
        user_id: The user ID
        query: The search query
        
    Returns:
        The search history entry
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Get search history
    search_history = user_state.get("agent_knowledge", {}).get("job_search", {}).get("search_history", [])
    
    # Create a new search history entry
    search_entry = {
        "id": str(uuid.uuid4()),
        "query": query,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add to search history
    search_history.append(search_entry)
    
    # Update the user state
    user_state["agent_knowledge"]["job_search"]["search_history"] = search_history
    global_state.set_state(user_state, user_id)
    
    return search_entry

def get_search_history_for_user(user_id: str, limit: int = 10) -> List[str]:
    """
    Get search history for a user
    
    Args:
        user_id: The user ID
        limit: Maximum number of search queries to return
        
    Returns:
        List of search queries
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Get search history
    search_history = user_state.get("agent_knowledge", {}).get("job_search", {}).get("search_history", [])
    
    # Sort by timestamp (newest first) and limit
    sorted_history = sorted(search_history, key=lambda x: x.get("timestamp", ""), reverse=True)
    limited_history = sorted_history[:limit]
    
    # Extract queries
    queries = [entry.get("query", "") for entry in limited_history]
    
    return queries

def add_recent_search(user_id: str, search_params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add a recent search to a user's recent searches
    
    Args:
        user_id: The user ID
        search_params: The search parameters
        
    Returns:
        The recent search entry
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Get recent searches
    recent_searches = user_state.get("agent_knowledge", {}).get("job_search", {}).get("recent_searches", [])
    
    # Create a new recent search entry
    search_entry = {
        "id": str(uuid.uuid4()),
        "params": search_params,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add to recent searches
    recent_searches.append(search_entry)
    
    # Limit to 10 recent searches
    if len(recent_searches) > 10:
        recent_searches = sorted(recent_searches, key=lambda x: x.get("timestamp", ""), reverse=True)[:10]
    
    # Update the user state
    user_state["agent_knowledge"]["job_search"]["recent_searches"] = recent_searches
    global_state.set_state(user_state, user_id)
    
    return search_entry

def get_recent_searches_for_user(user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get recent searches for a user
    
    Args:
        user_id: The user ID
        limit: Maximum number of recent searches to return
        
    Returns:
        List of recent search entries
    """
    # Get the user state
    user_state = global_state.get_state(user_id)
    
    # Get recent searches
    recent_searches = user_state.get("agent_knowledge", {}).get("job_search", {}).get("recent_searches", [])
    
    # Sort by timestamp (newest first) and limit
    sorted_searches = sorted(recent_searches, key=lambda x: x.get("timestamp", ""), reverse=True)
    limited_searches = sorted_searches[:limit]
    
    return limited_searches

def is_job_saved(user_id: str, job_id: str) -> bool:
    """
    Check if a job is saved by a user
    
    Args:
        user_id: The user ID
        job_id: The job ID
        
    Returns:
        True if the job is saved, False otherwise
    """
    # Get saved jobs
    saved_jobs = get_saved_jobs_for_user(user_id)
    
    # Check if job exists
    for job in saved_jobs:
        if job.get("id") == job_id:
            return True
    
    return False
