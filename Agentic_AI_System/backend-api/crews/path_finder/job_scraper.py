import os
import json
import random
import string
import re
import time
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional

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
        # Get API credentials from environment variables or use defaults for development
        app_id = os.environ.get("ADZUNA_APP_ID", "YOUR_APP_ID_HERE")
        api_key = os.environ.get("ADZUNA_API_KEY", "YOUR_API_KEY_HERE")
        
        # Construct the Adzuna API URL
        base_url = f"https://api.adzuna.com/v1/api/jobs/{location}/search/1"
        
        params = {
            "app_id": app_id,
            "app_key": api_key,
            "results_per_page": min(num_results, 100),  # API limit is 100 per page
            "what": query,
            "content-type": "application/json"
        }
        
        print(f"Searching Adzuna jobs for query: '{query}' in {location}")
        response = requests.get(base_url, params=params)
        
        if response.status_code != 200:
            print(f"Error: Adzuna API returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return []
        
        data = response.json()
        
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

def scrape_indeed_jobs(query: str, location: str = "Germany", num_results: int = 100) -> List[Dict[str, Any]]:
    """Scrape job listings from Indeed
    
    Args:
        query: Search query (job title + keywords)
        location: Location to search in
        num_results: Maximum number of results to return
        
    Returns:
        List of job listings
    """
    try:
        # Construct the Indeed search URL
        base_url = "https://de.indeed.com/jobs"
        params = {
            "q": query,
            "l": location,
            "sort": "date",  # Sort by date (newest first)
            "limit": num_results
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
            "Referer": "https://de.indeed.com/"
        }
        
        print(f"Scraping Indeed jobs for query: '{query}' in {location}")
        response = requests.get(base_url, params=params, headers=headers)
        
        if response.status_code != 200:
            print(f"Error: Received status code {response.status_code} from Indeed")
            print(f"Response content: {response.text[:200]}...")
            return []
        
        # Parse the HTML response
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find job listings
        job_listings = []
        job_cards = soup.select('div.job_seen_beacon')
        
        print(f"Found {len(job_cards)} Indeed job cards")
        
        for i, card in enumerate(job_cards[:num_results]):
            try:
                # Extract job details
                title_elem = card.select_one('h2.jobTitle')
                company_elem = card.select_one('span.companyName')
                location_elem = card.select_one('div.companyLocation')
                description_elem = card.select_one('div.job-snippet')
                
                title = title_elem.text.strip() if title_elem else "Unknown Title"
                company = company_elem.text.strip() if company_elem else "Unknown Company"
                location = location_elem.text.strip() if location_elem else "Unknown Location"
                description = description_elem.text.strip() if description_elem else ""
                
                # Extract salary if available
                salary_elem = card.select_one('div.salary-snippet')
                salary = salary_elem.text.strip() if salary_elem else "Salary not specified"
                
                # Generate a unique job ID
                job_id = f"indeed_{i+1}_{hash(title + company) % 10000}"
                
                # Extract education and experience requirements from description
                education_required = "Bachelor"
                if "master" in description.lower() or "master's" in description.lower():
                    education_required = "Master"
                elif "phd" in description.lower() or "doctorate" in description.lower():
                    education_required = "PhD"
                
                # Estimate experience required
                experience_required = 0
                exp_indicators = ["jahre erfahrung", "years experience", "years of experience"]
                for indicator in exp_indicators:
                    if indicator in description.lower():
                        # Try to find a number before the indicator
                        parts = description.lower().split(indicator)[0].split()
                        for part in reversed(parts):
                            if part.isdigit():
                                experience_required = int(part)
                                break
                
                # Create job listing
                job = {
                    "id": job_id,
                    "title": title,
                    "company_name": company,
                    "location": location,
                    "description": description,
                    "salary": salary,
                    "application_link": "https://de.indeed.com/viewjob?jk=" + job_id.split('_')[2],
                    "experience_required": experience_required,
                    "education_required": education_required,
                    "distance": random.randint(5, 50),  # Simulate distance
                    "source": "Indeed"
                }
                
                job_listings.append(job)
            except Exception as e:
                print(f"Error parsing Indeed job card: {e}")
        
        return job_listings
    
    except Exception as e:
        print(f"Error scraping Indeed Jobs: {e}")
        return []

def scrape_linkedin_jobs(query: str, location: str = "Germany", num_results: int = 100) -> List[Dict[str, Any]]:
    """Scrape job listings from LinkedIn
    
    Args:
        query: Search query (job title + keywords)
        location: Location to search in
        num_results: Maximum number of results to return
        
    Returns:
        List of job listings
    """
    try:
        # Construct the LinkedIn search URL
        base_url = "https://www.linkedin.com/jobs/search"
        params = {
            "keywords": query,
            "location": location,
            "position": 1,
            "pageNum": 0
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
            "Referer": "https://www.linkedin.com/"
        }
        
        print(f"Scraping LinkedIn jobs for query: '{query}' in {location}")
        response = requests.get(base_url, params=params, headers=headers)
        
        if response.status_code != 200:
            print(f"Error: Received status code {response.status_code} from LinkedIn")
            print(f"Response content: {response.text[:200]}...")
            return []
        
        # Parse the HTML response
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find job listings
        job_listings = []
        job_cards = soup.select('div.base-card')
        
        print(f"Found {len(job_cards)} LinkedIn job cards")
        
        for i, card in enumerate(job_cards[:num_results]):
            try:
                # Extract job details
                title_elem = card.select_one('h3.base-search-card__title')
                company_elem = card.select_one('h4.base-search-card__subtitle')
                location_elem = card.select_one('span.job-search-card__location')
                
                title = title_elem.text.strip() if title_elem else "Unknown Title"
                company = company_elem.text.strip() if company_elem else "Unknown Company"
                location = location_elem.text.strip() if location_elem else "Unknown Location"
                
                # Get job link
                link_elem = card.select_one('a.base-card__full-link')
                job_link = link_elem['href'] if link_elem and 'href' in link_elem.attrs else ""
                
                # Generate a unique job ID
                job_id = f"linkedin_{i+1}_{hash(title + company) % 10000}"
                
                # Create job listing with minimal info (we would need to click into each job for full details)
                job = {
                    "id": job_id,
                    "title": title,
                    "company_name": company,
                    "location": location,
                    "description": f"Position at {company}. Click the application link for more details.",
                    "salary": "Salary not specified",
                    "application_link": job_link,
                    "experience_required": 0,  # Default
                    "education_required": "Bachelor",  # Default
                    "distance": random.randint(5, 50),  # Simulate distance
                    "source": "LinkedIn"
                }
                
                job_listings.append(job)
            except Exception as e:
                print(f"Error parsing LinkedIn job card: {e}")
        
        return job_listings
    
    except Exception as e:
        print(f"Error scraping LinkedIn Jobs: {e}")
        return []

# Main function for job search
def search_jobs_online(job_title: str, education_level: str, years_experience: int,
                     location_radius: int, interest_points: List[str], limit: int = 100) -> Dict[str, Any]:
    """Searches for jobs online based on various criteria
    
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
    print(f"Searching for jobs: '{job_title}' with education '{education_level}', "
          f"{years_experience} years experience, {location_radius}km radius")
    print(f"Interest points: {', '.join(interest_points)}")
    
    # Sammle alle Jobs von verschiedenen Quellen
    all_jobs = []
    
    # Try to search jobs from Adzuna API
    try:
        # Build search query with job title and interest points
        query = job_title
        if interest_points:
            # Add top 2 interest points to the query
            query += " " + " ".join(interest_points[:2])
        
        # Search jobs from Adzuna
        adzuna_jobs = search_adzuna_jobs(query, "de", limit)
        
        if adzuna_jobs:
            print(f"Successfully found {len(adzuna_jobs)} jobs from Adzuna")
            all_jobs.extend(adzuna_jobs)
    except Exception as e:
        print(f"Error in Adzuna job search: {e}")
    
    # Try to scrape jobs from Indeed
    try:
        # Build search query with job title and interest points
        query = job_title
        if interest_points:
            # Add top 2 interest points to the query
            query += " " + " ".join(interest_points[:2])
        
        # Scrape jobs from Indeed
        indeed_jobs = scrape_indeed_jobs(query, "Deutschland", limit)
        
        if indeed_jobs:
            print(f"Successfully scraped {len(indeed_jobs)} jobs from Indeed")
            all_jobs.extend(indeed_jobs)
    except Exception as e:
        print(f"Error in Indeed job scraping: {e}")
    
    # Try to scrape jobs from LinkedIn
    try:
        # Build search query with job title and interest points
        query = job_title
        if interest_points:
            # Add top interest point to the query
            query += " " + interest_points[0] if interest_points else ""
        
        # Scrape jobs from LinkedIn
        linkedin_jobs = scrape_linkedin_jobs(query, "Deutschland", limit)
        
        if linkedin_jobs:
            print(f"Successfully scraped {len(linkedin_jobs)} jobs from LinkedIn")
            all_jobs.extend(linkedin_jobs)
    except Exception as e:
        print(f"Error in LinkedIn job scraping: {e}")
    
    # Wenn wir Jobs gefunden haben
    if all_jobs:
        print(f"Using {len(all_jobs)} real job listings")
        
        # Füge Match-Score hinzu, basierend auf den Suchkriterien
        for job in all_jobs:
            match_score = calculate_match_score(job, job_title, education_level, years_experience, interest_points)
            job["match_score"] = match_score
        
        # Sortiere nach Match-Score (absteigend)
        all_jobs.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        
        # Begrenze die Anzahl der zurückgegebenen Jobs
        all_jobs = all_jobs[:limit]
        
        # Create the response with real jobs
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
        # Keine Jobs gefunden - Fehlermeldung zurückgeben
        print("No jobs found. Returning error message.")
        
        response = {
            "job_title": job_title,
            "education_level": education_level,
            "years_experience": years_experience,
            "location_radius": location_radius,
            "interest_points": interest_points,
            "count": 0,
            "jobs": [],
            "error": "Leider konnten keine Jobs gefunden werden."
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
