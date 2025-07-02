"""
Job Filter Agent for PathFinder

This module provides functionality to filter job listings based on resume data
using Ollama for semantic matching.
"""

import os
import json
import requests
from typing import Dict, List, Any
import logging

from services.mongodb.global_state_service import global_state

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobFilterAgent:
    """
    Agent responsible for filtering job listings based on resume data.
    Uses Ollama for semantic matching between resume and job descriptions.
    """
    
    def __init__(self):
        """Initialize the JobFilterAgent"""
        self.ollama_url = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
        self.model = os.getenv("OLLAMA_MODEL", "llama3.2")
        logger.info(f"JobFilterAgent initialized with Ollama URL: {self.ollama_url}, Model: {self.model}")
    
    def get_resume_data(self, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Get resume data from the database
        
        Args:
            user_id: The user ID to get resume data for
            
        Returns:
            The resume data or None if not found
        """
        state = global_state.get_state(user_id)
        resume_id = state.get("agent_knowledge", {}).get("resume", {}).get("current_resume_id")
        
        if not resume_id:
            logger.warning(f"No resume found for user {user_id}")
            return None
            
        resume_data = state.get("agent_knowledge", {}).get("resume", {}).get("resumes", {}).get(resume_id)
        
        if not resume_data:
            logger.warning(f"Resume data not found for ID {resume_id}")
            return None
            
        return resume_data
    
    def filter_jobs(self, jobs: List[Dict[str, Any]], user_id: str = "default_user", top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Filter job listings based on resume data using Ollama
        
        Args:
            jobs: List of job listings to filter
            user_id: The user ID to get resume data for
            top_n: Number of top jobs to return
            
        Returns:
            List of top N job listings filtered by relevance to resume
        """
        if not jobs:
            logger.warning("No jobs provided to filter")
            return []
            
        # Get resume data
        resume_data = self.get_resume_data(user_id)
        
        if not resume_data:
            logger.warning("No resume data found, returning unfiltered jobs")
            return jobs[:top_n]
            
        # Extract key information from resume
        skills = resume_data.get("sections", {}).get("skills", "")
        experience = resume_data.get("sections", {}).get("experience", "")
        profile = resume_data.get("sections", {}).get("profile", "")
        
        # Create a prompt for Ollama to evaluate each job
        base_prompt = f"""
        I have a resume with the following information:
        
        Skills: {skills}
        
        Experience: {experience}
        
        Profile: {profile}
        
        I need to evaluate how well the following job matches my resume.
        Rate the match on a scale from 0 to 100, where 100 is a perfect match.
        Only return the numeric score, nothing else.
        
        Job: 
        """
        
        filtered_jobs = []
        
        for job in jobs:
            # Create job description
            job_desc = f"""
            Title: {job.get('title', '')}
            Company: {job.get('company_name', '')}
            Description: {job.get('description', '')}
            Requirements: {job.get('requirements', '')}
            """
            
            # Create full prompt
            prompt = base_prompt + job_desc
            
            try:
                # Call Ollama API
                response = requests.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.error(f"Ollama API error: {response.status_code}, {response.text}")
                    # Add default score if API call fails
                    job["resume_match_score"] = job.get("match_score", 0)
                else:
                    # Extract score from response
                    result = response.json()
                    response_text = result.get("response", "0").strip()
                    
                    # Try to parse the score
                    try:
                        # Extract just the number from the response
                        score_text = ''.join(c for c in response_text if c.isdigit() or c == '.')
                        score = float(score_text) if score_text else 0
                        job["resume_match_score"] = min(max(score, 0), 100)  # Clamp between 0-100
                    except ValueError:
                        logger.warning(f"Failed to parse score from Ollama response: {response_text}")
                        job["resume_match_score"] = job.get("match_score", 0)
            
            except Exception as e:
                logger.error(f"Error calling Ollama API: {str(e)}")
                job["resume_match_score"] = job.get("match_score", 0)
            
            filtered_jobs.append(job)
        
        # Sort by resume match score (descending)
        filtered_jobs.sort(key=lambda x: x.get("resume_match_score", 0), reverse=True)
        
        # Return top N jobs
        return filtered_jobs[:top_n]

# Create a singleton instance
job_filter = JobFilterAgent()
