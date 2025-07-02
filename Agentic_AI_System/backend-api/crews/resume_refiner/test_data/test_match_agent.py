#!/usr/bin/env python3
"""
Test script for MatchAgent
This script tests the MatchAgent class directly without using the API endpoints.
"""

import sys
import os
import time

# Add parent directory to path to import match_agent
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

# Force CPU usage for PyTorch to avoid MPS device issues
os.environ['PYTORCH_ENABLE_MPS_FALLBACK'] = '1'
os.environ['PYTORCH_MPS_HIGH_WATERMARK_RATIO'] = '0.0'

# Try to import the match agent
try:
    from crews.resume_refiner.match_agent import MatchAgent
except ImportError as e:
    print(f"Error importing MatchAgent: {e}")
    sys.exit(1)

import json
from pathlib import Path
import torch

# Force CPU usage to avoid MPS device issues on macOS
os.environ['CUDA_VISIBLE_DEVICES'] = ''
if hasattr(torch, 'set_default_device'):
    torch.set_default_device('cpu')
elif hasattr(torch, 'set_default_tensor_type'):
    torch.set_default_tensor_type('torch.FloatTensor')  # CPU tensor

from crews.resume_refiner.match_agent import MatchAgent
import numpy as np

# Create a test-specific subclass of MatchAgent that handles MPS tensors
class TestMatchAgent(MatchAgent):
    """
    Subclass of MatchAgent that overrides the _calculate_similarity method
    to handle macOS MPS tensor to numpy conversion issues and provides
    a mock implementation of _llm_call for testing.
    """
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity between two texts.
        Explicitly moves tensors to CPU before any numpy conversion.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        # Encode texts
        embedding1 = self.model.encode(text1)
        embedding2 = self.model.encode(text2)
        
        # Convert to numpy arrays, ensuring they're on CPU first
        if hasattr(embedding1, 'device') and str(embedding1.device) != 'cpu':
            embedding1 = embedding1.cpu()
        if hasattr(embedding2, 'device') and str(embedding2.device) != 'cpu':
            embedding2 = embedding2.cpu()
            
        # Convert to numpy arrays
        if hasattr(embedding1, 'numpy'):
            embedding1 = embedding1.numpy()
        if hasattr(embedding2, 'numpy'):
            embedding2 = embedding2.numpy()
        
        # Normalize embeddings
        embedding1 = embedding1 / np.linalg.norm(embedding1)
        embedding2 = embedding2 / np.linalg.norm(embedding2)
        
        # Calculate cosine similarity
        similarity = np.dot(embedding1, embedding2)
        
        return float(similarity)
    
    def _llm_call(self, prompt: str) -> str:
        """
        Mock implementation of _llm_call for testing.
        Returns a pre-defined response based on the job title in the prompt.
        
        Args:
            prompt: The prompt that would be sent to the LLM
            
        Returns:
            A mock LLM response
        """
        print("\nUsing mock LLM response (Ollama not available in test environment)")
        
        # Extract job title from prompt
        import re
        job_title_match = re.search(r'Title: ([^\n]+)', prompt)
        job_title = job_title_match.group(1) if job_title_match else "Unknown"
        
        # Return different mock responses based on job title
        if "Frontend" in job_title:
            return """{
                "match_score": 0.72,
                "missing_skills": ["React Testing Library", "TypeScript", "CSS-in-JS libraries"],
                "improvement_suggestions": [
                    "Highlight your React experience more prominently at the top of your resume",
                    "Add specific frontend projects with measurable outcomes",
                    "Include examples of responsive design work",
                    "Mention any experience with modern frontend build tools"
                ]
            }"""
        elif "Backend" in job_title:
            return """{
                "match_score": 0.68,
                "missing_skills": ["Microservices architecture", "Message queues", "Performance optimization"],
                "improvement_suggestions": [
                    "Emphasize your experience with Python and databases",
                    "Add metrics about API performance or scalability improvements",
                    "Include details about your experience with cloud services",
                    "Mention any backend system design experience"
                ]
            }"""
        else:  # Full Stack or other
            return """{
                "match_score": 0.75,
                "missing_skills": ["GraphQL", "CI/CD pipeline configuration", "Mobile-first development"],
                "improvement_suggestions": [
                    "Highlight full stack projects that demonstrate end-to-end implementation",
                    "Include metrics about application performance improvements",
                    "Add details about your experience with both frontend and backend technologies",
                    "Mention any experience with DevOps or deployment automation"
                ]
            }"""

# Sample resume text - Software Engineer with frontend and backend experience
RESUME_TEXT = """
JOHN DOE
Software Engineer
johndoe@example.com | (123) 456-7890 | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development.
Proficient in Python, JavaScript, and cloud technologies. Strong problem-solving skills
and experience working in agile teams.

SKILLS
Programming: Python, JavaScript, TypeScript, HTML, CSS
Frameworks: React, Node.js, Express, FastAPI, Django
Cloud: AWS (EC2, S3, Lambda), Docker, Kubernetes
Tools: Git, GitHub Actions, Jenkins, Jira

EXPERIENCE
Senior Software Engineer, ABC Technologies
January 2020 - Present
- Led development of a React-based dashboard that improved user engagement by 35%
- Implemented microservices architecture using Python and FastAPI
- Automated CI/CD pipelines with GitHub Actions, reducing deployment time by 50%
- Mentored junior developers and conducted code reviews

Software Developer, XYZ Solutions
March 2018 - December 2019
- Developed RESTful APIs using Node.js and Express
- Built responsive web interfaces with React and Material UI
- Deployed applications to AWS using Docker containers
- Collaborated with UX designers to implement user-friendly interfaces

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2017
"""

# Sample job descriptions for testing
JOB_DESCRIPTIONS = [
    {
        "job_id": "frontend_dev_1",
        "job_title": "Frontend Developer",
        "description": """
        Frontend Developer
        We are looking for a Frontend Developer to join our team in Munich.
        The ideal candidate should have experience with React, TypeScript, and modern web development practices.

        Requirements:
        - 3+ years experience with JavaScript and React
        - Experience with state management libraries (Redux, MobX)
        - Knowledge of HTML5, CSS3, and responsive design
        - Familiarity with testing frameworks like Jest
        - Experience with version control systems (Git)
        
        Nice to have:
        - Experience with Next.js or similar frameworks
        - Knowledge of GraphQL
        - Understanding of CI/CD pipelines
        """
    },
    {
        "job_id": "backend_dev_1",
        "job_title": "Backend Engineer",
        "description": """
        Backend Engineer
        DataSphere is seeking a talented Backend Engineer to develop robust server-side applications.
        You'll work with our team to build scalable and maintainable APIs and services.
        
        Requirements:
        - Strong experience with Python or Java
        - Knowledge of RESTful API design principles
        - Experience with SQL and NoSQL databases
        - Understanding of containerization (Docker, Kubernetes)
        - Familiarity with cloud platforms (AWS, GCP, or Azure)
        
        Bonus points:
        - Experience with microservices architecture
        - Knowledge of message queues (RabbitMQ, Kafka)
        - Understanding of serverless computing
        """
    },
    {
        "job_id": "fullstack_dev_1",
        "job_title": "Full Stack Developer",
        "description": """
        Full Stack Developer
        We're looking for a versatile Full Stack Developer who can work across our entire technology stack.
        
        Requirements:
        - Experience with both frontend (React, Angular, or Vue) and backend (Node.js, Python, or Java) development
        - Proficiency in HTML, CSS, and JavaScript
        - Knowledge of database design and SQL
        - Experience with version control systems
        - Understanding of web security best practices
        
        Desired skills:
        - Experience with TypeScript
        - Familiarity with cloud services (AWS, Azure, GCP)
        - Knowledge of CI/CD practices
        - Experience with agile development methodologies
        """
    }
]

def print_separator(title):
    """Print a separator with a title."""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80 + "\n")

def print_match_results(job_title, match_result):
    """Print the match results in a formatted way."""
    print(f"Job Title: {job_title}")
    # Ensure score is displayed correctly (not multiplied by 100 twice)
    score = match_result['overall_score']
    # If score is unusually high (>100), it might be already multiplied by 100
    if score > 100:
        score = score / 100
    print(f"Match Score: {score:.1f}%")
    
    print("\nMatching Skills:")
    for skill in match_result.get("matching_skills", []):
        print(f"  • {skill}")
    
    print("\nMissing Skills:")
    for skill in match_result.get("missing_skills", []):
        print(f"  • {skill}")
    
    print("\nImprovement Suggestions:")
    if "improvement_suggestions" in match_result and match_result["improvement_suggestions"]:
        for suggestion in match_result["improvement_suggestions"]:
            print(f"  • {suggestion}")
    else:
        print("  No improvement suggestions available")

def main():
    """Main function to test the MatchAgent."""
    print_separator("MatchAgent Test")
    
    # Create an instance of TestMatchAgent (our MPS-safe subclass)
    match_agent = TestMatchAgent()
    
    # Test with each job description individually
    for job_data in JOB_DESCRIPTIONS:
        print_separator(f"Testing with {job_data['job_title']}")
        
        # Get match results
        match_result = match_agent.match_single_job(RESUME_TEXT, job_data)
        
        # Print the results
        print_match_results(job_data["job_title"], match_result)

if __name__ == "__main__":
    main()
