import json
from typing import Dict, List, Any, Optional

def calculate_job_match_score(job: Dict[str, Any], 
                             user_years_experience: int,
                             user_education_level: str,
                             user_interest_points: List[str]) -> float:
    """
    Calculate a match score for a job based on user criteria.
    
    Args:
        job: Job listing dictionary
        user_years_experience: User's years of experience
        user_education_level: User's education level
        user_interest_points: User's interest points/skills
        
    Returns:
        A score between 0 and 100 indicating how well the job matches the user criteria
    """
    score = 0.0
    max_score = 100.0
    
    # Experience match (30% of total score)
    experience_weight = 0.3
    if 'experience_required' in job:
        # If user has more experience than required, give full points
        if user_years_experience >= job['experience_required']:
            score += 30.0
        else:
            # Calculate partial score based on how close user is to required experience
            experience_ratio = user_years_experience / job['experience_required'] if job['experience_required'] > 0 else 1.0
            score += 30.0 * min(1.0, experience_ratio)
    
    # Education match (20% of total score)
    education_weight = 0.2
    education_levels = {
        "High School": 1,
        "Associate": 2,
        "Bachelor": 3,
        "Master": 4,
        "PhD": 5
    }
    
    user_edu_level = education_levels.get(user_education_level, 0)
    required_edu_level = education_levels.get(job.get('education_required', ''), 0)
    
    if user_edu_level >= required_edu_level:
        score += 20.0
    else:
        # Partial points if close
        score += 10.0
    
    # Interest points/skills match (40% of total score)
    interest_weight = 0.4
    if 'description' in job:
        interest_matches = 0
        for interest in user_interest_points:
            if interest.lower() in job['description'].lower():
                interest_matches += 1
        
        if len(user_interest_points) > 0:
            interest_ratio = interest_matches / len(user_interest_points)
            score += 40.0 * interest_ratio
    
    # Location/distance (10% of total score)
    distance_weight = 0.1
    if 'distance' in job:
        # Closer is better
        distance_score = max(0, 1 - (job['distance'] / 100))  # Normalize to 0-1
        score += 10.0 * distance_score
    
    return score

def filter_and_rank_jobs(jobs: List[Dict[str, Any]], user_years_experience: int = 0, 
                     user_education_level: str = '', user_interest_points: List[str] = None,
                     location_radius: int = 50, top_n: int = 10) -> Dict[str, Any]:
    """
    Filter and rank jobs based on user criteria.
    
    Args:
        jobs: List of job dictionaries to filter and rank
        user_years_experience: User's years of experience
        user_education_level: User's education level
        user_interest_points: User's interest points/skills
        location_radius: Search radius in km
        top_n: Number of top jobs to return
        
    Returns:
        Dictionary containing top N job listings ranked by match score
    """
    if not jobs:
        print("No jobs provided")
        return {"top_jobs": [], "total_jobs_found": 0}
    
    # Ensure user_interest_points is a list
    if user_interest_points is None:
        user_interest_points = []
    
    # Calculate match score for each job
    for job in jobs:
        job['match_score'] = calculate_job_match_score(
            job, 
            user_years_experience,
            user_education_level,
            user_interest_points
        )
    
    # Sort jobs by match score (descending)
    ranked_jobs = sorted(jobs, key=lambda x: x.get('match_score', 0), reverse=True)
    
    # Return top N jobs
    top_jobs = ranked_jobs[:top_n]
    
    # Create result with metadata
    result = {
        "total_jobs_found": len(jobs),
        "top_jobs_count": len(top_jobs),
        "top_jobs": top_jobs,
        "interest_points": user_interest_points,
    }
    
    return result

# For testing
if __name__ == "__main__":
    # Example call with mock data
    from job_scraper import search_jobs_online
    
    # Get mock job data
    mock_data = search_jobs_online(
        job_title="Software Developer",
        education_level="Bachelor",
        years_experience=2,
        location_radius=50,
        interest_points=["AI", "Machine Learning", "Python"]
    )
    
    # Filter and rank jobs
    result = filter_and_rank_jobs(mock_data)
    
    # Print results
    print(f"Found {result['total_jobs_found']} jobs, showing top {result['top_jobs_count']}")
    print(f"Top jobs for {result['job_title']} position:")
    
    for i, job in enumerate(result['top_jobs']):
        print(f"\n{i+1}. {job['title']} at {job['company_name']}")
        print(f"   Location: {job['location']}")
        print(f"   Match Score: {job['match_score']:.1f}/100")
        print(f"   Requirements: {job['requirements']}")
        print(f"   Salary: {job['salary']}")
