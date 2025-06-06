from crewai import Agent
from langchain_community.llms import Ollama
import os

class MockMateAgent:
    """
    Mock Mate Agent for interview practice.
    This agent simulates a job interviewer to help users practice for interviews.
    """
    
    def __init__(self, model_name="llama3.2", ollama_base_url=None):
        """Initialize the Mock Mate agent with the specified LLM model.
        
        Args:
            model_name (str): Name of the Ollama model to use
            ollama_base_url (str, optional): Base URL for Ollama API. Defaults to environment variable or http://localhost:11434
        """
        # Get Ollama URL from environment variable or use default
        if ollama_base_url is None:
            ollama_base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
            
        self.llm = Ollama(model=model_name, base_url=ollama_base_url)
        self.agent = self._create_agent()
        
    def _create_agent(self):
        """Create and configure the CrewAI agent for interview simulation."""
        return Agent(
            role="Interview Simulator",
            goal="Conduct realistic job interviews to help users practice and improve their interviewing skills",
            backstory="""You are an experienced technical interviewer who has conducted thousands of 
            interviews for top tech companies. You understand what makes a good candidate and can 
            simulate realistic interview scenarios across different roles and industries. Your feedback
            is constructive and helps candidates improve their performance.""",
            verbose=True,
            llm=self.llm
        )
    
    def start_interview(self, job_role, experience_level):
        """
        Start a new interview session for the specified job role and experience level.
        
        Args:
            job_role (str): The job role for the interview (e.g., "Software Engineer", "Data Scientist")
            experience_level (str): The experience level (e.g., "Entry", "Mid", "Senior")
            
        Returns:
            str: Initial interview greeting and first question
        """
        # This would typically involve the agent taking an action, but for now we'll return a template
        return f"Welcome to your mock interview for the {job_role} position at the {experience_level} level.Let's begin with a common question: Could you tell me about yourself and why you're interested in this role?"
    
    def respond_to_answer(self, job_role, experience_level, interview_history, user_response):
        """
        Generate the next interview question or feedback based on the user's response.
        
        Args:
            job_role (str): The job role for the interview
            experience_level (str): The experience level
            interview_history (list): Previous exchanges in the interview
            user_response (str): The user's most recent response
            
        Returns:
            str: Next question or feedback
        """
        # In a full implementation, this would use the agent to generate a contextual response
        # For now, we'll return a placeholder
        return "That's a good introduction. Now, could you describe a challenging project you've worked on and how you approached it?"
    
    def provide_feedback(self, interview_history):
        """
        Provide overall feedback on the interview performance.
        
        Args:
            interview_history (list): The complete interview exchange
            
        Returns:
            str: Detailed feedback on the interview performance
        """
        # This would use the agent to analyze the entire interview and provide feedback
        return "Overall, you did well in the interview. Your responses were clear and structured. Some areas for improvement include providing more specific examples and quantifying your achievements. Continue practicing and you'll see improvement in your interview skills."
