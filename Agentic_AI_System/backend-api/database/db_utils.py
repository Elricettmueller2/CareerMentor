from database.models import User, SavedJob, SearchHistory, get_db_session
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

def get_or_create_user(user_id: str, username: str = None, email: str = None) -> User:
    """
    Get a user by ID or create a new one if it doesn't exist
    
    Args:
        user_id: The user ID
        username: Optional username for new users
        email: Optional email for new users
        
    Returns:
        User object
    """
    session = get_db_session()
    user = session.query(User).filter(User.id == user_id).first()
    
    if not user:
        # Create a new user if one doesn't exist
        user = User(
            id=user_id,
            username=username or f"user_{user_id}",
            email=email or f"user_{user_id}@example.com"
        )
        session.add(user)
        session.commit()
    
    session.close()
    return user

def save_job_for_user(user_id: str, job_data: Dict[str, Any]) -> SavedJob:
    """
    Save a job for a user
    
    Args:
        user_id: The user ID
        job_data: The job data to save
        
    Returns:
        SavedJob object
    """
    session = get_db_session()
    
    # Get or create the user
    user = get_or_create_user(user_id)
    
    # Check if the job is already saved
    existing_job = session.query(SavedJob).filter(
        SavedJob.user_id == user_id,
        SavedJob.job_id == job_data.get('id')
    ).first()
    
    if existing_job:
        session.close()
        return existing_job
    
    # Create a new saved job
    saved_job = SavedJob(
        user_id=user_id,
        job_id=job_data.get('id'),
        job_title=job_data.get('title', 'Unknown Title'),
        company=job_data.get('company', 'Unknown Company'),
        location=job_data.get('location'),
        description=job_data.get('description'),
        job_data=json.dumps(job_data)
    )
    
    session.add(saved_job)
    session.commit()
    session.close()
    
    return saved_job

def unsave_job_for_user(user_id: str, job_id: str) -> bool:
    """
    Remove a saved job for a user
    
    Args:
        user_id: The user ID
        job_id: The job ID to remove
        
    Returns:
        True if the job was removed, False otherwise
    """
    session = get_db_session()
    
    # Find the saved job
    saved_job = session.query(SavedJob).filter(
        SavedJob.user_id == user_id,
        SavedJob.job_id == job_id
    ).first()
    
    if not saved_job:
        session.close()
        return False
    
    # Delete the saved job
    session.delete(saved_job)
    session.commit()
    session.close()
    
    return True

def get_saved_jobs_for_user(user_id: str) -> List[Dict[str, Any]]:
    """
    Get all saved jobs for a user
    
    Args:
        user_id: The user ID
        
    Returns:
        List of saved job data
    """
    session = get_db_session()
    
    # Get all saved jobs for the user
    saved_jobs = session.query(SavedJob).filter(
        SavedJob.user_id == user_id
    ).order_by(SavedJob.saved_at.desc()).all()
    
    # Convert to list of dictionaries
    result = []
    for job in saved_jobs:
        job_data = job.full_job_data
        result.append(job_data)
    
    session.close()
    return result

def add_search_history(user_id: str, query: str) -> SearchHistory:
    """
    Add a search query to a user's search history
    
    Args:
        user_id: The user ID
        query: The search query
        
    Returns:
        SearchHistory object
    """
    session = get_db_session()
    
    # Get or create the user
    user = get_or_create_user(user_id)
    
    # Create a new search history entry
    search_history = SearchHistory(
        user_id=user_id,
        query=query
    )
    
    session.add(search_history)
    session.commit()
    session.close()
    
    return search_history

def get_search_history_for_user(user_id: str, limit: int = 10) -> List[str]:
    """
    Get search history for a user
    
    Args:
        user_id: The user ID
        limit: Maximum number of search queries to return
        
    Returns:
        List of search queries
    """
    session = get_db_session()
    
    # Get search history for the user
    search_history = session.query(SearchHistory).filter(
        SearchHistory.user_id == user_id
    ).order_by(SearchHistory.searched_at.desc()).limit(limit).all()
    
    # Extract queries
    queries = [history.query for history in search_history]
    
    session.close()
    return queries

def is_job_saved(user_id: str, job_id: str) -> bool:
    """
    Check if a job is saved by a user
    
    Args:
        user_id: The user ID
        job_id: The job ID
        
    Returns:
        True if the job is saved, False otherwise
    """
    session = get_db_session()
    
    # Check if the job is saved
    saved_job = session.query(SavedJob).filter(
        SavedJob.user_id == user_id,
        SavedJob.job_id == job_id
    ).first()
    
    session.close()
    return saved_job is not None

# Example usage
if __name__ == "__main__":
    # Create a test user
    user_id = "test_user_" + str(uuid.uuid4())[:8]
    
    # Create a test job
    job_data = {
        "id": "JOB-123456",
        "title": "Software Developer",
        "company": "Test Company",
        "location": "Berlin, Germany",
        "description": "A test job description"
    }
    
    # Save the job
    saved_job = save_job_for_user(user_id, job_data)
    print(f"Saved job: {saved_job}")
    
    # Add search history
    add_search_history(user_id, "Software Developer")
    
    # Get saved jobs
    saved_jobs = get_saved_jobs_for_user(user_id)
    print(f"Saved jobs: {saved_jobs}")
    
    # Get search history
    search_history = get_search_history_for_user(user_id)
    print(f"Search history: {search_history}")
    
    # Check if job is saved
    is_saved = is_job_saved(user_id, "JOB-123456")
    print(f"Is job saved: {is_saved}")
    
    # Unsave the job
    unsaved = unsave_job_for_user(user_id, "JOB-123456")
    print(f"Job unsaved: {unsaved}")
    
    # Check if job is saved again
    is_saved = is_job_saved(user_id, "JOB-123456")
    print(f"Is job saved: {is_saved}")
