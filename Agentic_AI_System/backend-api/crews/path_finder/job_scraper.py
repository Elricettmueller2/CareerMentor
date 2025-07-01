import os
import json
import random
import string
import re
import time
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from pathlib import Path

# Bestimme den Pfad zur .env-Datei (im Hauptverzeichnis des Projekts)
base_dir = Path(__file__).parent.parent.parent
env_path = base_dir / '.env'

# Lade Umgebungsvariablen aus .env-Datei mit explizitem Pfad
print(f"Loading environment variables from: {env_path}")
load_dotenv(dotenv_path=env_path)

# Überprüfe, ob die API-Schlüssel geladen wurden
app_id = os.environ.get("ADZUNA_APP_ID")
api_key = os.environ.get("ADZUNA_API_KEY")
print(f"ADZUNA_APP_ID loaded: {'Yes' if app_id else 'No'}")
print(f"ADZUNA_API_KEY loaded: {'Yes' if api_key else 'No'}")

# Helper functions for job scraping
def calculate_match_score(job: Dict[str, Any], job_title: str, education_level: str, 
                         years_experience: int, interest_points: List[str]) -> float:
    """Calculate a match score for a job based on search criteria
    
    Args:
        job: Job listing dictionary
        job_title: The job title from search criteria
        education_level: Education level from search criteria
        years_experience: Years of experience from search criteria
        interest_points: List of interest points from search criteria
        
    Returns:
        A score between 0 and 100 indicating how well the job matches the criteria
    """
    score = 0.0
    max_score = 100.0
    
    # Title match (max 30 points)
    if job_title.lower() in job.get("title", "").lower():
        score += 30.0
    elif any(word.lower() in job.get("title", "").lower() for word in job_title.lower().split()):
        score += 15.0
    
    # Experience match (max 20 points)
    job_exp = job.get("experience_required", 0)
    if isinstance(job_exp, (int, float)):
        exp_diff = abs(job_exp - years_experience)
        if exp_diff == 0:
            score += 20.0
        elif exp_diff <= 2:
            score += 15.0
        elif exp_diff <= 4:
            score += 10.0
        else:
            score += 5.0
    
    # Education match (max 15 points)
    job_edu = job.get("education_required", "").lower()
    if education_level.lower() in job_edu:
        score += 15.0
    
    # Interest points match (max 35 points)
    if interest_points:
        points_per_interest = 35.0 / len(interest_points)
        for point in interest_points:
            # Check if interest point is in job description or skills
            if point.lower() in job.get("description", "").lower():
                score += points_per_interest
            elif any(point.lower() in skill.lower() for skill in job.get("skills", [])):
                score += points_per_interest
    
    # Normalize score to be between 0 and 100
    return min(score, max_score)

def search_adzuna_jobs(query: str, location: str = "de", num_results: int = 100) -> List[Dict[str, Any]]:
    """Search for jobs using the Adzuna API
    
    Args:
        query: Search query (job title and keywords)
        location: Location to search in (default: de for Germany)
        num_results: Maximum number of results to return
        
    Returns:
        List of job listings
    """
    try:
        # Get API credentials from environment variables
        app_id = os.environ.get("ADZUNA_APP_ID")
        api_key = os.environ.get("ADZUNA_API_KEY")
        
        if not app_id or not api_key:
            print("Error: Adzuna API credentials not found in environment variables")
            print("Please set ADZUNA_APP_ID and ADZUNA_API_KEY environment variables")
            return []
        
        # Construct the Adzuna API URL
        base_url = f"https://api.adzuna.com/v1/api/jobs/{location}/search/1"
        
        # Füge Debugging-Ausgabe hinzu
        print(f"Using Adzuna API with APP_ID: {app_id[:4]}...{app_id[-4:] if len(app_id) > 8 else ''}")
        print(f"API URL: {base_url}")
        print(f"Search query: '{query}'")
        
        params = {
            "app_id": app_id,
            "app_key": api_key,
            "results_per_page": min(num_results, 100),  # API limit is 100 per page
            "what": query,
            "content-type": "application/json"
        }
        
        print(f"Searching Adzuna jobs for query: '{query}' in {location}")
        response = requests.get(base_url, params=params)
        
        # Zeige vollständige Antwort für Debugging
        print(f"API response status code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Error: Adzuna API returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return []
        
        data = response.json()
        
        # Zeige Antwortdaten für Debugging
        print(f"API response data: count={data.get('count', 0)}, total={data.get('__META__', {}).get('total_count', 0)}")
        
        if "results" not in data:
            print("Error: No results found in Adzuna API response")
            return []
        
        jobs = []
        for job_data in data["results"]:
            # Extract job details
            job_id = job_data.get("id", "")
            title = job_data.get("title", "")
            company = job_data.get("company", {}).get("display_name", "Unbekanntes Unternehmen")
            description = job_data.get("description", "")
            location = job_data.get("location", {}).get("display_name", "")
            
            # Extract salary if available
            salary_min = job_data.get("salary_min", 0)
            salary_max = job_data.get("salary_max", 0)
            salary = ""
            if salary_min > 0 and salary_max > 0:
                salary = f"€{int(salary_min // 1000)}K - €{int(salary_max // 1000)}K"
            
            # Extract application link
            application_link = job_data.get("redirect_url", "")
            
            # Create standardized job object
            job = {
                "id": job_id,
                "title": title,
                "company_name": company,
                "location": location,
                "description": description,
                "requirements": "",  # Adzuna doesn't provide structured requirements
                "salary": salary,
                "application_link": application_link,
                "experience_required": 0,  # Not provided by Adzuna
                "education_required": "",  # Not provided by Adzuna
                "distance": 0,  # Not provided by Adzuna
                "source": "Adzuna",
                "skills": []  # Not provided by Adzuna
            }
            
            # Try to extract experience and education from description
            if "erfahrung" in description.lower():
                # Look for patterns like "3 Jahre Erfahrung" or "3+ Jahre Erfahrung"
                exp_match = re.search(r'(\d+)(?:\+)?\s*(?:jahre|jahr)\s*erfahrung', description.lower())
                if exp_match:
                    job["experience_required"] = int(exp_match.group(1))
            
            if any(edu in description.lower() for edu in ["bachelor", "master", "diplom", "ausbildung", "studium"]):
                for edu in ["bachelor", "master", "diplom", "ausbildung", "studium"]:
                    if edu in description.lower():
                        job["education_required"] = edu.capitalize()
                        break
            
            # Try to extract skills from description
            common_skills = ["python", "java", "javascript", "react", "angular", "vue", "node", "sql", 
                            "aws", "azure", "docker", "kubernetes", "git", "agile", "scrum"]
            job["skills"] = [skill for skill in common_skills if skill in description.lower()]
            
            jobs.append(job)
        
        print(f"Found {len(jobs)} jobs from Adzuna")
        return jobs
        
    except Exception as e:
        print(f"Error in Adzuna job search: {e}")
        return []

def search_jobs_online(job_title: str, education_level: str, years_experience: int,
                     location_radius: int, interest_points: List[str], limit: int = 100) -> Dict[str, Any]:
    """
    Search for jobs online based on user criteria using only Adzuna API
    
    Args:
        job_title: The job title to search for
        education_level: Highest education level achieved
        years_experience: Years of job experience
        location_radius: Search radius in km
        interest_points: List of interest points
        limit: Maximum number of results to return
        
    Returns:
        Dictionary containing search results
    """
    print(f"Searching for jobs with title: {job_title}, education: {education_level}, experience: {years_experience} years")
    
    all_jobs = []
    
    # Try to search for jobs using Adzuna API
    try:
        # Build search query with job title and interest points
        query = job_title
        if interest_points:
            # Add top interest points to the query (up to 2)
            query += " " + " ".join(interest_points[:2])
        
        # Search for jobs using Adzuna API
        adzuna_jobs = search_adzuna_jobs(query, "de", limit)
        
        if adzuna_jobs:
            print(f"Successfully found {len(adzuna_jobs)} jobs from Adzuna")
            all_jobs.extend(adzuna_jobs)
            
            # If we need more jobs, try with a more specific query
            if len(all_jobs) < limit and len(interest_points) > 2:
                # Try with different interest points
                for i in range(2, min(len(interest_points), 4)):
                    if len(all_jobs) >= limit:
                        break
                        
                    additional_query = f"{job_title} {interest_points[i]}"
                    print(f"Searching for more jobs with query: '{additional_query}'")
                    
                    additional_jobs = search_adzuna_jobs(additional_query, "de", limit - len(all_jobs))
                    if additional_jobs:
                        print(f"Found {len(additional_jobs)} additional jobs")
                        # Filter out duplicates by ID
                        existing_ids = {job["id"] for job in all_jobs}
                        new_jobs = [job for job in additional_jobs if job["id"] not in existing_ids]
                        all_jobs.extend(new_jobs)
                        print(f"Added {len(new_jobs)} unique jobs")
    except Exception as e:
        print(f"Error in Adzuna job search: {e}")
    
    # Wenn wir Jobs gefunden haben
    if all_jobs:
        print(f"Using {len(all_jobs)} job listings from Adzuna")
        
        # Füge Match-Score hinzu, basierend auf den Suchkriterien
        for job in all_jobs:
            match_score = calculate_match_score(job, job_title, education_level, years_experience, interest_points)
            job["match_score"] = match_score
        
        # Sortiere nach Match-Score (absteigend)
        all_jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        
        # Begrenze die Anzahl der zurückgegebenen Jobs
        all_jobs = all_jobs[:limit]
        
        # Create the response with jobs
        response = {
            "job_title": job_title,
            "education_level": education_level,
            "years_experience": years_experience,
            "location_radius": location_radius,
            "interest_points": interest_points,
            "count": len(all_jobs),
            "jobs": all_jobs
        }
    else:
        # Keine Jobs gefunden - Fehlermeldung nur für Benutzer, nicht für Datenbank
        print("No jobs found. Returning empty result without error message.")
        
        response = {
            "job_title": job_title,
            "education_level": education_level,
            "years_experience": years_experience,
            "location_radius": location_radius,
            "interest_points": interest_points,
            "count": 0,
            "jobs": []
            # Kein "error" Feld hier, damit es nicht in der Datenbank gespeichert wird
        }
    
    return response

# For testing
if __name__ == "__main__":
    # Example call
    result = search_jobs_online(
        job_title="Software Developer",
        education_level="Bachelor",
        years_experience=2,
        location_radius=50,
        interest_points=["AI", "Machine Learning", "Python"]
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))

# Create a singleton instance of the job scraper for import
job_scraper_instance = {"search_jobs": search_jobs_online}
