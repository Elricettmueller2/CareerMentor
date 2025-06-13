from crews.path_finder.job_scraper import job_scraper
from typing import Dict, Any, List
from database.db_utils import (
    save_job_for_user, 
    unsave_job_for_user, 
    get_saved_jobs_for_user, 
    add_search_history, 
    get_search_history_for_user,
    is_job_saved
)

def suggest_roles(query: str) -> Dict[str, Any]:
    """
    Generate search suggestions based on partial input.
    
    Args:
        query: The partial search query
        
    Returns:
        Dictionary with suggestions
    """
    suggestions = job_scraper.suggest_search_terms(query)
    return {"suggestions": suggestions}


def search_jobs_online(query: str, user_id: str = None, limit: int = 10) -> Dict[str, Any]:
    """
    Search for jobs matching the query.
    
    Args:
        query: The search query
        user_id: Optional user ID to track search history
        limit: Maximum number of results to return
        
    Returns:
        Dictionary with job listings
    """
    # Record search history if user_id is provided
    if user_id:
        add_search_history(user_id, query)
    
    # Get jobs from the scraper
    jobs = job_scraper.search_jobs(query, limit)
    
    # If user_id is provided, check which jobs are saved
    if user_id:
        for job in jobs:
            job["is_saved"] = is_job_saved(user_id, job["id"])
    
    return {"jobs": jobs, "query": query, "count": len(jobs)}


def get_job_details(job_id: str, user_id: str = None) -> Dict[str, Any]:
    """
    Get detailed information about a specific job.
    
    Args:
        job_id: The ID of the job to retrieve
        user_id: Optional user ID to check if job is saved
        
    Returns:
        Dictionary with job details
    """
    job = job_scraper.get_job_details(job_id)
    
    # Check if the job is saved if user_id is provided
    if user_id:
        job["is_saved"] = is_job_saved(user_id, job_id)
    
    return {"job": job}


def save_job(user_id: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save a job for a user.
    
    Args:
        user_id: The ID of the user
        job_data: The job data to save
        
    Returns:
        Dictionary with result
    """
    saved_job = save_job_for_user(user_id, job_data)
    return {
        "success": True,
        "message": "Job saved successfully",
        "job_id": job_data.get("id")
    }


def unsave_job(user_id: str, job_id: str) -> Dict[str, Any]:
    """
    Remove a saved job for a user.
    
    Args:
        user_id: The ID of the user
        job_id: The ID of the job to remove
        
    Returns:
        Dictionary with result
    """
    success = unsave_job_for_user(user_id, job_id)
    return {
        "success": success,
        "message": "Job removed successfully" if success else "Job not found",
        "job_id": job_id
    }


def get_saved_jobs(user_id: str) -> Dict[str, Any]:
    """
    Get all saved jobs for a user.
    
    Args:
        user_id: The ID of the user
        
    Returns:
        Dictionary with saved jobs
    """
    saved_jobs = get_saved_jobs_for_user(user_id)
    return {
        "saved_jobs": saved_jobs,
        "count": len(saved_jobs)
    }


def get_job_recommendations(user_id: str, limit: int = 3) -> Dict[str, Any]:
    """
    Get job recommendations based on user's search history.
    
    Args:
        user_id: The ID of the user
        limit: Maximum number of recommendations
        
    Returns:
        Dictionary with job recommendations
    """
    # Get user's search history
    search_history = get_search_history_for_user(user_id)
    
    # If no search history is available, use some default job categories
    if not search_history:
        search_history = ["Software Developer", "Data Scientist", "Product Manager"]
    
    # Select a random term from search history for recommendations
    import random
    query = random.choice(search_history)
    
    # Get recommendations based on the selected query
    recommendations = job_scraper.search_jobs(query, limit)
    
    # Check which jobs are saved
    for job in recommendations:
        job["is_saved"] = is_job_saved(user_id, job["id"])
    
    return {
        "recommendations": recommendations,
        "based_on": query,
        "count": len(recommendations)
    }