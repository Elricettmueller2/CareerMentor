import sys
import os
import json

# Add the parent directory to the path for imports to work when running directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import job_scraper and job_filter directly from the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Import the modules we need for direct testing
from job_scraper import search_jobs_online
from job_filter import job_filter

# Flag to indicate if we're running in direct mode (without Crew AI)
DIRECT_MODE = True

# Try to import Crew AI components if available
try:
    from crewai import Agent, Task, Crew, LLM
    from crew import PathFinderCrew
    # Wir verwenden immer den direkten Modus, um Probleme mit Ollama zu vermeiden
    # DIRECT_MODE = False
    print("Crew AI module found, but using direct mode for reliability.")
except ImportError:
    print("Note: crewai module not found. Running in direct mode without Crew AI framework.")
    DIRECT_MODE = True

def run_path_finder_crew(job_title: str, education_level: str, years_experience: int, 
                       location_radius: int, interest_points: str):
    """Run the Path Finder crew to search and filter jobs based on user criteria
    
    Args:
        job_title: The job title to search for (e.g., "Software Developer")
        education_level: Highest education level achieved (e.g., "Bachelor")
        years_experience: Years of job experience (0-10+)
        location_radius: Search radius in km (10-200)
        interest_points: Comma-separated list of interests (e.g., "AI, Sustainability")
    
    Returns:
        The raw result from the crew containing the top 10 job matches
    """
    # Convert interest_points string to list if needed
    if isinstance(interest_points, str):
        interest_points = [point.strip() for point in interest_points.split(',')]
    
    # Option 1: Use the Crew AI framework (preferred for production)
    crew = PathFinderCrew().crew()
    result = crew.kickoff(inputs={
        "job_title": job_title,
        "education_level": education_level,
        "years_experience": years_experience,
        "location_radius": location_radius,
        "interest_points": interest_points
    })
    return result.raw


def run_path_finder_direct(job_title: str, education_level: str = None, years_experience: int = 0, 
                       location_radius: int = 50, interest_points: str = None, degree: str = None,
                       hard_skills_rating: int = 5, soft_skills_rating: int = 5, user_id: str = "default_user",
                       limit: int = 10, job_data: dict = None):
    """Run the Path Finder directly without using the Crew AI framework
    
    This is useful for testing and development purposes.
    
    Args:
        job_title: The job title to search for
        education_level: Highest education level achieved
        years_experience: Years of job experience
        location_radius: Search radius in km
        interest_points: Comma-separated list of interest points
        degree: Alternative name for education_level (for API compatibility)
        hard_skills_rating: Rating of hard skills (1-10)
        soft_skills_rating: Rating of soft skills (1-10)
        user_id: User ID for personalization
        limit: Maximum number of results to return
        job_data: Additional job data for specific operations
        
    Returns:
        Dictionary containing search results with top jobs
    """
    print(f"Searching for jobs: {job_title}")
    
    # Handle special cases based on job_data
    if job_data and "job_id" in job_data:
        # This is for analyze_job_requirements endpoint
        return {
            "job_id": job_data["job_id"],
            "analysis": "Job analysis would be performed here with the Path Finder crew",
            "requirements": ["Sample requirement 1", "Sample requirement 2"],
            "qualifications": ["Sample qualification 1", "Sample qualification 2"]
        }
    
    if job_data and "user_profile" in job_data and "job_ids" in job_data:
        # This is for compare_skills_to_job endpoint
        return {
            "user_id": user_id,
            "job_matches": [
                {"job_id": job_id, "match_score": 85, "matching_skills": ["Skill 1", "Skill 2"], 
                 "missing_skills": ["Skill 3"]} for job_id in job_data["job_ids"]
            ],
            "recommendations": "Focus on improving your skills in the areas where you have gaps."
        }
    
    # Use degree as education_level if provided (for API compatibility)
    if degree and not education_level:
        education_level = degree
    
    # Default values
    if not education_level:
        education_level = "Bachelor"
    
    # Convert interest_points from string to list if needed
    if isinstance(interest_points, str):
        interest_points = [point.strip() for point in interest_points.split(',') if point.strip()]
    elif not interest_points:
        interest_points = []
    
    # Step 1: Search for jobs
    search_results = search_jobs_online(
        job_title=job_title,
        education_level=education_level,
        years_experience=years_experience,
        location_radius=location_radius,
        interest_points=interest_points
    )
    
    # Step 2: Filter and rank jobs
    filtered_results = job_filter.filter_jobs(
        jobs=search_results["jobs"],
        user_id=user_id,
        top_n=limit
    )
    
    # Combine results
    result = {
        "job_title": job_title,
        "education_level": education_level,
        "years_experience": years_experience,
        "location_radius": location_radius,
        "interest_points": interest_points,
        "total_jobs_found": search_results["count"],
        "top_jobs_count": len(filtered_results),
        "top_jobs": filtered_results
    }
    
    return result


# For testing purposes
if __name__ == "__main__":
    # Example usage
    job_title = "Software Developer"
    education_level = "Bachelor"
    years_experience = 2
    location_radius = 50
    interest_points = "AI, Machine Learning, Python"
    
    # Always use direct mode for local testing
    result = run_path_finder_direct(
        job_title=job_title,
        education_level=education_level,
        years_experience=years_experience,
        location_radius=location_radius,
        interest_points=interest_points
    )
    
    print(f"\nFound {result['total_jobs_found']} jobs, showing top {result['top_jobs_count']}")
    print(f"Top jobs for {result['job_title']} position:")
    
    for i, job in enumerate(result['top_jobs'][:3]):  # Show first 3 for brevity
        print(f"\n{i+1}. {job['title']} at {job['company_name']}")
        print(f"   Location: {job['location']}")
        print(f"   Match Score: {job['match_score']:.1f}/100")
        print(f"   Requirements: {job['requirements']}")
        print(f"   Salary: {job['salary']}")
    
    print("\n... (more jobs available)")
    
    # Note: The Crew AI version would be used in the Docker container
    # where all dependencies are properly installed
