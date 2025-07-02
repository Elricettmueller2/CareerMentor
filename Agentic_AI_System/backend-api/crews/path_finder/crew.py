"""
PathFinder Crew for CareerMentor

This module implements the PathFinder crew using CrewAI.
It consists of agents for job searching and filtering.
"""

from crewai import Agent, Task, Crew, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
import litellm
import os
import pathlib
import logging
from typing import Dict, List, Any

# Import the agent implementations
from .job_scraper import search_jobs_online
from .job_filter import JobFilterAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

litellm._turn_on_debug()

llm = LLM(
    model="ollama/llama3.2",
    base_url=os.getenv("OLLAMA_BASE_URL", "http://ollama:11434"),
)

@CrewBase
class PathFinderCrew():
    """
    PathFinder Crew for job search and filtering
    
    This crew consists of two agents:
    1. JobSearchAgent: Searches for jobs based on user criteria
    2. JobFilterAgent: Filters jobs based on resume data
    """
    
    agents: list[BaseAgent]
    tasks: list[Task]
    base_dir = pathlib.Path(__file__).parent.absolute()
    agents_config = os.path.join(base_dir, "config/agents.yaml")
    tasks_config = os.path.join(base_dir, "config/tasks.yaml")
    
    def __init__(self):
        """Initialize the PathFinder crew"""
        self.job_filter_agent_instance = JobFilterAgent()
        logger.info("PathFinderCrew initialized")
    
    @agent
    def job_search_agent(self) -> Agent:
        """Agent for searching jobs online"""
        return Agent(
            name="JobSearchAgent",
            role="Job Search Expert",
            description="Searches for jobs online based on user criteria",
            goal="Find relevant job listings that match user criteria",
            backstory="I am an expert job search agent that can find job listings from various sources.",
            verbose=True,
            llm=llm
        )
    
    @agent
    def job_filter_agent(self) -> Agent:
        """Agent for filtering jobs based on resume data"""
        return Agent(
            name="JobFilterAgent",
            role="Resume Matching Expert",
            description="Filters job listings based on resume data",
            goal="Find the best job matches based on user's resume and preferences",
            backstory="I am an expert job filter agent that can analyze job listings and match them with user resumes.",
            verbose=True,
            llm=llm
        )
    
    @task
    def search_jobs_task(self) -> Task:
        """Task for searching jobs online"""
        return Task(
            description="Search for jobs online based on user criteria",
            expected_output="A list of job listings that match the user criteria",
            agent=self.job_search_agent,
            async_execution=False
        )
    
    @task
    def filter_jobs_task(self) -> Task:
        """Task for filtering jobs based on resume data"""
        return Task(
            description="Filter job listings based on resume data",
            expected_output="A list of top job matches based on user's resume",
            agent=self.job_filter_agent,
            async_execution=False
        )
    
    @crew
    def crew(self) -> Crew:
        """Create the PathFinder crew"""
        return Crew(
            agents=[self.job_search_agent, self.job_filter_agent],
            tasks=[self.search_jobs_task, self.filter_jobs_task],
            verbose=True
        )
    
    # Helper methods to expose functionality directly
    
    def search_jobs(self, job_title: str, education_level: str, years_experience: int,
                   location_radius: int, interest_points: List[str], limit: int = 100) -> Dict[str, Any]:
        """
        Search for jobs online based on user criteria
        
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
        logger.info(f"Searching for jobs with title: {job_title}, education: {education_level}, experience: {years_experience} years")
        
        # Use the job_scraper module to search for jobs
        search_results = search_jobs_online(
            job_title=job_title,
            education_level=education_level,
            years_experience=years_experience,
            location_radius=location_radius,
            interest_points=interest_points,
            limit=limit
        )
        
        if search_results.get("count", 0) == 0:
            logger.warning(f"No jobs found for search criteria: {job_title}")
        else:
            logger.info(f"Found {search_results.get('count', 0)} jobs for search criteria: {job_title}")
            
        return search_results
    
    def filter_jobs(self, jobs: List[Dict[str, Any]], user_id: str = "default_user", top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Filter job listings based on resume data
        
        Args:
            jobs: List of job listings to filter
            user_id: The user ID to get resume data for
            top_n: Number of top jobs to return
            
        Returns:
            List of top N job listings filtered by relevance to resume
        """
        logger.info(f"Filtering {len(jobs)} jobs for user: {user_id}")
        
        if not jobs:
            logger.warning("No jobs to filter")
            return []
            
        # Use the job_filter module to filter jobs
        filtered_jobs = self.job_filter_agent_instance.filter_jobs(jobs, user_id, top_n)
        
        logger.info(f"Filtered to {len(filtered_jobs)} top jobs")
        return filtered_jobs
    
    def search_and_filter_jobs(self, job_title: str, education_level: str, years_experience: int,
                              location_radius: int, interest_points: List[str], 
                              user_id: str = "default_user", top_n: int = 10) -> Dict[str, Any]:
        """
        Search for jobs and filter them based on resume data
        
        Args:
            job_title: The job title to search for
            education_level: Highest education level achieved
            years_experience: Years of job experience
            location_radius: Search radius in km
            interest_points: List of interest points
            user_id: The user ID to get resume data for
            top_n: Number of top jobs to return
            
        Returns:
            Dictionary containing search and filter results
        """
        logger.info(f"Starting search and filter process for user: {user_id}")
        
        # Step 1: Search for jobs
        search_results = self.search_jobs(
            job_title=job_title,
            education_level=education_level,
            years_experience=years_experience,
            location_radius=location_radius,
            interest_points=interest_points,
            limit=100  # Get more jobs than needed for filtering
        )
        
        # Step 2: Filter jobs based on resume data
        if search_results.get("count", 0) > 0:
            filtered_jobs = self.filter_jobs(
                jobs=search_results["jobs"],
                user_id=user_id,
                top_n=top_n
            )
            
            # Create result with filtered jobs
            result = {
                "job_title": job_title,
                "education_level": education_level,
                "years_experience": years_experience,
                "location_radius": location_radius,
                "interest_points": interest_points,
                "total_jobs_found": search_results.get("count", 0),
                "filtered_jobs_count": len(filtered_jobs),
                "jobs": filtered_jobs
            }
            
            logger.info(f"Search and filter complete. Found {result['total_jobs_found']} jobs, filtered to {result['filtered_jobs_count']} top matches")
            return result
        else:
            # No jobs found - return empty result without error message
            # The error message should be shown to the user but not stored in the database
            logger.warning(f"No jobs found for search criteria: {job_title}")
            
            result = {
                "job_title": job_title,
                "education_level": education_level,
                "years_experience": years_experience,
                "location_radius": location_radius,
                "interest_points": interest_points,
                "total_jobs_found": 0,
                "filtered_jobs_count": 0,
                "jobs": []
            }
            
            return result

# Create a singleton instance
path_finder_crew = PathFinderCrew()
