#!/usr/bin/env python3
"""
Test script for PathFinder functionality
"""

import sys
import os
import logging
import json
from pathlib import Path
from dotenv import load_dotenv

# Bestimme den Pfad zur .env-Datei (im Hauptverzeichnis des Projekts)
base_dir = Path(__file__).parent.parent
env_path = base_dir / '.env'

# Lade Umgebungsvariablen aus .env-Datei mit explizitem Pfad
print(f"Loading environment variables from: {env_path}")
load_dotenv(dotenv_path=env_path)

# Überprüfe, ob die API-Schlüssel geladen wurden
app_id = os.environ.get("ADZUNA_APP_ID")
api_key = os.environ.get("ADZUNA_API_KEY")
print(f"ADZUNA_APP_ID loaded: {'Yes' if app_id else 'No'}")
print(f"ADZUNA_API_KEY loaded: {'Yes' if api_key else 'No'}")

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.mongodb.global_state_service import global_state
from crews.path_finder.crew import path_finder_crew

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def add_mock_resume():
    """Add a mock resume to the database"""
    try:
        logger.info("Adding mock resume to database...")
        
        # Add mock resume for default user
        mock_resume = global_state.add_mock_resume()
        
        logger.info(f"Mock resume added successfully with {len(mock_resume['keywords'])} keywords")
        logger.info(f"Resume sections: {', '.join(mock_resume['sections'].keys())}")
        
        # Verify the resume was added by retrieving it
        state = global_state.get_state()
        resume_id = state.get("agent_knowledge", {}).get("resume", {}).get("current_resume_id")
        
        if resume_id:
            logger.info(f"Resume ID in database: {resume_id}")
            logger.info("Mock resume added successfully to the database!")
            return True
        else:
            logger.error("Failed to verify resume in database")
            return False
            
    except Exception as e:
        logger.error(f"Error adding mock resume: {str(e)}")
        return False

def test_job_search():
    """Test job search functionality"""
    try:
        logger.info("Testing job search functionality...")
        
        # Search for jobs - Verwende einfachere Suchbegriffe für bessere Ergebnisse
        search_results = path_finder_crew.search_jobs(
            job_title="Developer",  # Einfacherer Jobtitel
            education_level="Bachelor",
            years_experience=3,
            location_radius=50,
            interest_points=["Python", "JavaScript"]  # Weniger Suchbegriffe
        )
        
        logger.info(f"Found {search_results.get('count', 0)} jobs")
        
        return search_results
    
    except Exception as e:
        logger.error(f"Error searching for jobs: {str(e)}")
        return None

def test_job_filter(jobs):
    """Test job filter functionality"""
    try:
        if not jobs or jobs.get("count", 0) == 0:
            logger.warning("No jobs to filter")
            return None
            
        logger.info("Testing job filter functionality...")
        
        # Filter jobs
        filtered_jobs = path_finder_crew.filter_jobs(
            jobs=jobs.get("jobs", []),
            user_id="default_user",
            top_n=10
        )
        
        logger.info(f"Filtered to {len(filtered_jobs)} top jobs")
        
        return filtered_jobs
    
    except Exception as e:
        logger.error(f"Error filtering jobs: {str(e)}")
        return None

def test_search_and_filter():
    """Test combined search and filter functionality"""
    try:
        logger.info("Testing combined search and filter functionality...")
        
        # Search and filter jobs - Verwende einfachere Suchbegriffe für bessere Ergebnisse
        results = path_finder_crew.search_and_filter_jobs(
            job_title="Developer",  # Einfacherer Jobtitel
            education_level="Bachelor",
            years_experience=3,
            location_radius=50,
            interest_points=["Python", "JavaScript"],  # Weniger Suchbegriffe
            user_id="default_user",
            top_n=10
        )
        
        logger.info(f"Found {results.get('total_jobs_found', 0)} jobs, filtered to {results.get('filtered_jobs_count', 0)} top matches")
        
        return results
    
    except Exception as e:
        logger.error(f"Error in search and filter: {str(e)}")
        return None

def main():
    """Run the PathFinder test"""
    try:
        # Step 1: Add mock resume
        resume_added = add_mock_resume()
        
        if not resume_added:
            logger.error("Failed to add mock resume, exiting")
            sys.exit(1)
        
        # Step 2: Test job search
        search_results = test_job_search()
        
        if not search_results:
            logger.error("Job search failed, exiting")
            sys.exit(1)
        
        # Step 3: Test job filter
        filtered_jobs = test_job_filter(search_results)
        
        if not filtered_jobs:
            logger.warning("Job filtering failed or no jobs to filter")
        
        # Step 4: Test combined search and filter
        combined_results = test_search_and_filter()
        
        if not combined_results:
            logger.error("Combined search and filter failed")
            sys.exit(1)
        
        # Print the top 3 job matches
        logger.info("\n=== TOP JOB MATCHES ===")
        
        for i, job in enumerate(combined_results.get("jobs", [])[:3]):
            logger.info(f"\nJob {i+1}: {job.get('title')}")
            logger.info(f"Company: {job.get('company_name')}")
            logger.info(f"Resume Match Score: {job.get('resume_match_score', 0):.1f}")
            logger.info(f"Location: {job.get('location')}")
            
        # Save results to file
        with open("path_finder_results.json", "w") as f:
            json.dump(combined_results, f, indent=2)
            
        logger.info(f"\nResults saved to path_finder_results.json")
        
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
