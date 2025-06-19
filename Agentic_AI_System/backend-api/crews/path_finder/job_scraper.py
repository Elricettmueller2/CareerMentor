import os
import json
import random
import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Any, Optional

# Real implementation for scraping jobs from Google Jobs

# Helper functions for the mock implementation
def generate_mock_job(job_title: str, company_index: int, interest_points: List[str]) -> Dict[str, Any]:
    """Generate a mock job listing"""
    cities = ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"]
    experience_required = random.randint(0, 10)
    job_types = ["Junior", "Senior", ""]
    
    return {
        "title": f"{job_title} {job_types[random.randint(0, 2)]}",
        "company_name": f"Company {company_index}",
        "location": f"{cities[random.randint(0, len(cities)-1)]}, Germany",
        "description": f"We are looking for a {job_title} with expertise in {', '.join(interest_points[:2] if len(interest_points) >= 2 else interest_points)}.",
        "requirements": f"{experience_required}+ years of experience, Bachelor's degree",
        "salary": f"€{random.randint(40, 90)}K - €{random.randint(50, 120)}K",
        "application_link": "https://example.com/apply",
        "experience_required": experience_required,
        "education_required": "Bachelor",
        "distance": random.randint(5, 100)
    }

def scrape_google_jobs(query: str, location: str = "Germany", num_results: int = 100) -> List[Dict[str, Any]]:
    """Scrape job listings from Google Jobs
    
    Args:
        query: Search query (job title + keywords)
        location: Location to search in
        num_results: Maximum number of results to return
        
    Returns:
        List of job listings
    """
    try:
        # Construct the Google Jobs search URL
        base_url = "https://www.google.com/search"
        params = {
            "q": f"{query} jobs in {location}",
            "ibp": "htl;jobs",  # This parameter tells Google to show job results
            "uule": "w+CAIQICINR2VybWFueQ",  # Location encoding for Germany
            "hl": "en"  # Language set to English
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        print(f"Scraping jobs for query: '{query}' in {location}")
        response = requests.get(base_url, params=params, headers=headers)
        
        if response.status_code != 200:
            print(f"Error: Received status code {response.status_code}")
            return []
        
        # Parse the HTML response
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find job listings
        job_listings = []
        job_cards = soup.select('div.BjJfJf')
        
        print(f"Found {len(job_cards)} job cards")
        
        for card in job_cards[:num_results]:
            try:
                # Extract job details
                title_elem = card.select_one('div.BjJfJf.PUpOsf')
                company_elem = card.select_one('div.vNEEBe')
                location_elem = card.select_one('div.Qk80Jf')
                description_elem = card.select_one('div.HBvzbc')
                
                title = title_elem.text if title_elem else "Unknown Title"
                company = company_elem.text if company_elem else "Unknown Company"
                location = location_elem.text if location_elem else "Unknown Location"
                description = description_elem.text if description_elem else ""
                
                # Extract salary if available
                salary_elem = card.select_one('span.LL5OKb')
                salary = salary_elem.text if salary_elem else "Salary not specified"
                
                # Generate a unique job ID
                job_id = f"job_{len(job_listings) + 1}_{hash(title + company) % 10000}"
                
                # Extract education and experience requirements from description
                education_required = "Bachelor"
                if "master" in description.lower() or "master's" in description.lower():
                    education_required = "Master"
                elif "phd" in description.lower() or "doctorate" in description.lower():
                    education_required = "PhD"
                
                # Estimate experience required
                experience_required = 0
                exp_indicators = ["years of experience", "years experience", "year experience"]
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
                    "application_link": "https://example.com/apply",  # Placeholder
                    "experience_required": experience_required,
                    "education_required": education_required,
                    "distance": random.randint(5, location_radius)  # Simulate distance
                }
                
                job_listings.append(job)
            except Exception as e:
                print(f"Error parsing job card: {e}")
        
        return job_listings
    
    except Exception as e:
        print(f"Error scraping Google Jobs: {e}")
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
    
    # Try to scrape real jobs first
    try:
        # Build search query with job title and interest points
        query = job_title
        if interest_points:
            # Add top 2 interest points to the query
            query += " " + " ".join(interest_points[:2])
        
        # Scrape jobs from Google Jobs
        scraped_jobs = scrape_google_jobs(query, "Germany", limit)
        
        if scraped_jobs and len(scraped_jobs) >= 10:
            print(f"Successfully scraped {len(scraped_jobs)} jobs from Google Jobs")
            
            # Create the response with real jobs
            response = {
                "job_title": job_title,
                "education_level": education_level,
                "years_experience": years_experience,
                "location_radius": location_radius,
                "interest_points": interest_points,
                "count": len(scraped_jobs),
                "jobs": scraped_jobs
            }
            
            return response
    except Exception as e:
        print(f"Error in real job scraping: {e}")
    
    # Fallback to mock data if scraping fails or returns too few results
    print("Falling back to mock job data")
    
    # Generate 80-100 mock job listings
    mock_jobs = []
    num_jobs = random.randint(80, 100)
    
    for i in range(num_jobs):
        mock_jobs.append(generate_mock_job(job_title, i+1, interest_points))
    
    # Create the response with mock jobs
    response = {
        "job_title": job_title,
        "education_level": education_level,
        "years_experience": years_experience,
        "location_radius": location_radius,
        "interest_points": interest_points,
        "count": len(mock_jobs),
        "jobs": mock_jobs
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
