from typing import Dict, List, Any, Optional
from crewai import Agent, Crew, Task
from .parser_agent import ParserAgent
from .layout_agent import LayoutAgent
from .quality_agent import QualityAgent
from .match_agent import MatchAgent
from services.mongodb.mongodb_resume_utils import (
    save_parsed_resume,
    save_resume_feedback,
    save_job_matching_results,
    get_saved_jobs_for_matching
)

class ResumeRefinerCrew:
    """
    Crew for resume refinement tasks including parsing, layout analysis,
    quality evaluation, and job matching.
    """
    
    def __init__(self):
        """Initialize agents for resume processing"""
        self.parser = ParserAgent()
        self.layout_agent = LayoutAgent()
        self.quality_agent = QualityAgent()
        self.match_agent = MatchAgent()
    
    def parse_document(self, upload_file, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Parse an uploaded resume document and save to MongoDB if user_id is provided.
        
        Args:
            upload_file: FastAPI UploadFile object
            user_id: Optional user ID for saving to MongoDB
            
        Returns:
            Dictionary with parsed resume data
        """
        # Save the uploaded file
        upload_id = self.parser.save_upload(upload_file)
        
        # Parse the document with sections
        parsed_data = self.parser.parse_with_sections(upload_id)
        
        # Save to MongoDB if user_id is provided
        if user_id:
            save_parsed_resume(user_id, upload_id, parsed_data)
        
        # Return the parsed data and upload_id
        return {
            "upload_id": upload_id,
            "parsed_data": parsed_data
        }
    
    def analyze_layout(self, upload_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze the layout of a parsed resume and save feedback to MongoDB if user_id is provided.
        
        Args:
            upload_id: ID of the uploaded file
            user_id: Optional user ID for saving to MongoDB
            
        Returns:
            Dictionary with layout analysis results
        """
        # Get the parsed data
        parsed_data = self.parser.parse_with_sections(upload_id)
        
        # Analyze the layout
        layout_analysis = self.layout_agent.analyze_layout(parsed_data)
        
        # Save to MongoDB if user_id is provided
        if user_id:
            feedback_data = {
                "layout_analysis": layout_analysis
            }
            save_resume_feedback(user_id, upload_id, feedback_data)
        
        return layout_analysis
    
    def evaluate_quality(self, upload_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Evaluate the quality of a parsed resume and save feedback to MongoDB if user_id is provided.
        
        Args:
            upload_id: ID of the uploaded file
            user_id: Optional user ID for saving to MongoDB
            
        Returns:
            Dictionary with quality evaluation results
        """
        # Get the parsed data
        parsed_data = self.parser.parse_with_sections(upload_id)
        
        # Evaluate the quality
        quality_evaluation = self.quality_agent.evaluate_resume(parsed_data)
        
        # Save to MongoDB if user_id is provided
        if user_id:
            # Get existing feedback if any
            feedback_data = {}
            if user_id:
                from services.mongodb.mongodb_resume_utils import get_parsed_resume
                resume_data = get_parsed_resume(user_id, upload_id)
                if resume_data and "feedback" in resume_data:
                    feedback_data = resume_data["feedback"]
            
            # Add quality evaluation to feedback
            feedback_data["quality_evaluation"] = quality_evaluation
            save_resume_feedback(user_id, upload_id, feedback_data)
        
        return quality_evaluation
    
    def match_jobs(self, upload_id: str, job_descriptions: List[Dict[str, Any]], user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Match a resume against job descriptions and save results to MongoDB if user_id is provided.
        
        Args:
            upload_id: ID of the uploaded file
            job_descriptions: List of job description dictionaries
            user_id: Optional user ID for saving to MongoDB
            
        Returns:
            List of job matches with similarity scores
        """
        # Get the parsed data
        parsed_data = self.parser.parse_with_sections(upload_id)
        
        # Match against jobs
        job_matches = self.match_agent.match_jobs(parsed_data, job_descriptions)
        
        # Save to MongoDB if user_id is provided
        if user_id:
            for job_match in job_matches:
                job_id = job_match.get("job_id", job_match.get("id", "unknown"))
                save_job_matching_results(user_id, upload_id, job_id, job_match)
        
        return job_matches
    
    def match_with_saved_jobs(self, upload_id: str, user_id: str) -> List[Dict[str, Any]]:
        """
        Match a resume against user's saved jobs from MongoDB.
        
        Args:
            upload_id: ID of the uploaded file
            user_id: User ID for retrieving saved jobs
            
        Returns:
            List of job matches with similarity scores
        """
        # Get saved jobs for the user
        saved_jobs = get_saved_jobs_for_matching(user_id)
        
        if not saved_jobs:
            return []
        
        # Match against saved jobs
        return self.match_jobs(upload_id, saved_jobs, user_id)