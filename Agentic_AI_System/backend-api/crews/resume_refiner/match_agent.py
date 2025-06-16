import re
from typing import Dict, List, Any, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer

class MatchAgent:
    """
    Agent responsible for matching resumes to job descriptions using semantic similarity.
    Uses sentence transformers to create embeddings and calculate similarity scores.
    """
    
    # Model to use for embeddings
    MODEL_NAME = "all-MiniLM-L6-v2"
    
    def __init__(self):
        """Initialize the sentence transformer model"""
        self.model = SentenceTransformer(self.MODEL_NAME)
    
    def match_jobs(self, resume_data: Dict[str, Any], job_descriptions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Match a resume against multiple job descriptions.
        
        Args:
            resume_data: Dictionary with parsed resume text and sections
            job_descriptions: List of job description dictionaries
            
        Returns:
            List of job matches with similarity scores and highlighted matches
        """
        # Extract resume text
        resume_text = self._prepare_resume_text(resume_data)
        
        # Process each job
        results = []
        for job in job_descriptions:
            match_result = self.match_single_job(resume_text, job)
            results.append(match_result)
            
        # Sort by overall match score
        results.sort(key=lambda x: x["overall_score"], reverse=True)
        
        return results
    
    def match_single_job(self, resume_text: str, job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Match a resume against a single job description.
        
        Args:
            resume_text: Processed resume text
            job: Job description dictionary
            
        Returns:
            Dictionary with match results
        """
        # Extract job description text
        job_text = job.get("description", "")
        job_title = job.get("title", "Unknown Position")
        job_id = job.get("id", "unknown")
        
        # Calculate similarity scores for different sections
        overall_score = self._calculate_similarity(resume_text, job_text)
        
        # Extract skills from job description
        job_skills = self._extract_skills(job_text)
        
        # Extract skills from resume
        resume_skills = self._extract_skills(resume_text)
        
        # Find matching skills
        matching_skills = [skill for skill in resume_skills if any(
            self._calculate_similarity(skill, job_skill) > 0.75 for job_skill in job_skills
        )]
        
        # Find missing skills
        missing_skills = [skill for skill in job_skills if all(
            self._calculate_similarity(skill, resume_skill) < 0.75 for resume_skill in resume_skills
        )]
        
        # Calculate skill match percentage
        skill_match_pct = 0
        if job_skills:
            skill_match_pct = round(len(matching_skills) / len(job_skills) * 100)
        
        # Prepare result
        result = {
            "job_id": job_id,
            "job_title": job_title,
            "overall_score": round(float(overall_score) * 100),  # Convert to percentage
            "skill_match_percentage": skill_match_pct,
            "matching_skills": matching_skills[:10],  # Limit to top 10
            "missing_skills": missing_skills[:5],     # Limit to top 5
            "job_summary": self._generate_job_summary(job_text)
        }
        
        return result
    
    def _prepare_resume_text(self, resume_data: Dict[str, Any]) -> str:
        """
        Extract and prepare resume text for matching.
        Prioritizes certain sections and formats text.
        """
        sections = resume_data.get("sections", {})
        
        # Prioritize these sections
        priority_sections = ["profile", "skills", "experience"]
        
        # Build combined text with section headers
        combined_text = ""
        
        # Add priority sections first
        for section in priority_sections:
            if section in sections and sections[section]:
                combined_text += f"{section.upper()}:\n{sections[section]}\n\n"
        
        # Add other sections
        for section, content in sections.items():
            if section not in priority_sections and content:
                combined_text += f"{section.upper()}:\n{content}\n\n"
        
        # If no sections found, use full text
        if not combined_text and "full_text" in resume_data:
            combined_text = resume_data["full_text"]
            
        return combined_text
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity between two texts using sentence transformers.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        # Handle empty texts
        if not text1 or not text2:
            return 0.0
            
        # Create embeddings
        embedding1 = self.model.encode(text1, convert_to_tensor=True)
        embedding2 = self.model.encode(text2, convert_to_tensor=True)
        
        # Calculate cosine similarity
        similarity = embedding1 @ embedding2.T / (
            np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
        )
        
        return float(similarity)
    
    def _extract_skills(self, text: str) -> List[str]:
        """
        Extract potential skills from text.
        
        Args:
            text: Text to extract skills from
            
        Returns:
            List of potential skills
        """
        # Simple extraction based on common patterns
        skills = []
        
        # Look for skill sections
        skill_section = re.search(r"(?:Skills|Competencies|Expertise):(.*?)(?:\n\n|\Z)", 
                                text, re.IGNORECASE | re.DOTALL)
        
        if skill_section:
            # Extract items from skill section
            skill_text = skill_section.group(1)
            
            # Extract comma or bullet separated items
            items = re.split(r'[,•\n]', skill_text)
            skills.extend([item.strip() for item in items if item.strip()])
        
        # Extract technical terms and acronyms from whole text
        tech_terms = re.findall(r'\b[A-Z][A-Za-z0-9+#]+([\.\-][A-Za-z0-9]+)*\b', text)
        skills.extend([term for term in tech_terms if len(term) > 1])
        
        # Remove duplicates and sort
        unique_skills = list(set(skills))
        
        return unique_skills
    
    def _generate_job_summary(self, job_text: str) -> str:
        """
        Generate a brief summary of the job description.
        
        Args:
            job_text: Full job description text
            
        Returns:
            Brief summary (first few sentences)
        """
        # Extract first paragraph or first few sentences
        first_para = job_text.split("\n\n")[0] if "\n\n" in job_text else job_text
        
        # Limit to first few sentences
        sentences = re.split(r'[.!?]', first_para)
        summary = '. '.join(sentences[:3]) + '.'
        
        # Truncate if too long
        if len(summary) > 200:
            summary = summary[:197] + '...'
            
        return summary
