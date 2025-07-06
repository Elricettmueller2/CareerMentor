from crews.track_pal.crew import TrackPalCrew
from typing import Dict, Any, List, Optional

# Create a singleton instance with MongoDB backend
track_pal = TrackPalCrew()

# AGENT FEATURES - Functions that use CrewAI for AI capabilities
def run_check_reminders(user_id: str, applications: List[Dict[str, Any]] = None) -> str:
    """
    This is an AI-powered agent function that analyzes applications and generates
    personalized reminders based on application status and timeline.
    
    Args:
        user_id: The user ID to check reminders for
        applications: Optional list of applications to use instead of loading from storage
    """
    crew = track_pal.crew(task_type="check_reminders", user_id=user_id, applications=applications)
    result = crew.kickoff()
    return result

def run_analyze_patterns(user_id: str, applications: List[Dict[str, Any]] = None) -> str:
    """
    This is an AI-powered agent function that identifies patterns in the user's
    job applications and provides insights and recommendations.
    
    Args:
        user_id: The user ID to analyze patterns for
        applications: Optional list of applications to use instead of loading from storage
    """
    crew = track_pal.crew(task_type="analyze_patterns", user_id=user_id, applications=applications)
    result = crew.kickoff()
    return result

# DATA OPERATIONS - Basic CRUD functions for application data
def get_applications(user_id: str) -> List[Dict[str, Any]]:
    """Get all applications for a user
    
    This is a basic data retrieval function, not an AI agent feature.
    """
    return track_pal.application_manager.get_applications(user_id)

def save_application(user_id: str, application: Dict[str, Any]) -> Dict[str, Any]:
    """Save a new application
    
    This is a basic data creation function, not an AI agent feature.
    """
    return track_pal.application_manager.save_application(user_id, application)

def update_application(user_id: str, app_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update an existing application
    
    This is a basic data update function, not an AI agent feature.
    """
    return track_pal.application_manager.update_application(user_id, app_id, updates)
