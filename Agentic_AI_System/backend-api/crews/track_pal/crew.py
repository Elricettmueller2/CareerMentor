from crewai import Agent, Task, Crew, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List, Dict, Any, Optional
import os
import json
from datetime import datetime, timedelta
import litellm

# Enable debug mode for litellm
litellm._turn_on_debug()

# Application status constants
SAVED = "SAVED"
APPLIED = "APPLIED"
INTERVIEW = "INTERVIEW"
OFFER = "OFFER"
REJECTED = "REJECTED"
ACCEPTED = "ACCEPTED"
DECLINED = "DECLINED"

# Application data storage and retrieval
class ApplicationManager:
    def __init__(self, storage_dir="./data"):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
    
    def _get_user_file_path(self, user_id: str) -> str:
        return os.path.join(self.storage_dir, f"{user_id}_applications.json")
    
    def get_applications(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all applications for a user"""
        file_path = self._get_user_file_path(user_id)
        
        # Create default data if file doesn't exist
        if not os.path.exists(file_path):
            return self._get_dummy_data()
        
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading applications: {e}")
            return self._get_dummy_data()
    
    def save_application(self, user_id: str, application: Dict[str, Any]) -> Dict[str, Any]:
        """Save a new application"""
        applications = self.get_applications(user_id)
        
        # Generate ID if not provided
        if "id" not in application:
            application["id"] = str(len(applications) + 1)
        
        # Set default status if not provided
        if "status" not in application:
            application["status"] = SAVED
        
        # Add timestamp
        application["created_at"] = datetime.now().isoformat()
        application["updated_at"] = application["created_at"]
        
        # Add to list
        applications.append(application)
        
        # Save to file
        self._save_applications(user_id, applications)
        
        return application
    
    def update_application(self, user_id: str, app_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing application"""
        applications = self.get_applications(user_id)
        
        for i, app in enumerate(applications):
            if app.get("id") == app_id:
                # Update fields
                for key, value in updates.items():
                    applications[i][key] = value
                
                # Update timestamp
                applications[i]["updated_at"] = datetime.now().isoformat()
                
                # Save to file
                self._save_applications(user_id, applications)
                
                return applications[i]
        
        return None  # Application not found
    
    def _save_applications(self, user_id: str, applications: List[Dict[str, Any]]):
        """Save applications to file"""
        file_path = self._get_user_file_path(user_id)
        
        try:
            with open(file_path, 'w') as f:
                json.dump(applications, f, indent=2)
        except Exception as e:
            print(f"Error saving applications: {e}")
    
    def _get_dummy_data(self) -> List[Dict[str, Any]]:
        """Return dummy data for testing"""
        now = datetime.now()
        
        return [
            {
                "id": "1",
                "company": "Acme Corp",
                "position": "UI Designer",
                "status": APPLIED,
                "location": "San Francisco, CA",
                "days_since_applied": 12,
                "days_until_followup": 2,
                "notes": "Applied through company website",
                "created_at": (now - timedelta(days=12)).isoformat(),
                "updated_at": (now - timedelta(days=12)).isoformat()
            },
            {
                "id": "2",
                "company": "TechStart",
                "position": "Frontend Developer",
                "status": INTERVIEW,
                "location": "Remote",
                "days_since_applied": 5,
                "interview_date": (now + timedelta(days=1)).isoformat(),
                "notes": "First interview scheduled",
                "created_at": (now - timedelta(days=5)).isoformat(),
                "updated_at": (now - timedelta(days=1)).isoformat()
            },
            {
                "id": "3",
                "company": "BigCorp",
                "position": "UX Researcher",
                "status": REJECTED,
                "location": "New York, NY",
                "days_since_applied": 20,
                "notes": "Rejected after initial screening",
                "created_at": (now - timedelta(days=20)).isoformat(),
                "updated_at": (now - timedelta(days=15)).isoformat()
            }
        ]

# Initialize LLM with Ollama
llm = LLM(
    model="ollama/llama3.2",
    base_url="http://ollama:11434",
)

@CrewBase
class TrackPalCrew():
    agents: List[BaseAgent]
    tasks: List[Task]
    agents_config_path = "config/agents.yaml"
    tasks_config_path = "config/tasks.yaml"
    
    def __init__(self, storage_dir="./data"):
        # Initialize application manager
        self.application_manager = ApplicationManager(storage_dir)
        
        # Load configuration files
        import yaml
        import os
        
        # Get the directory of this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Load agents config
        agents_path = os.path.join(current_dir, self.agents_config_path)
        try:
            with open(agents_path, 'r') as f:
                self.agents_config = yaml.safe_load(f)
        except Exception as e:
            print(f"Error loading agents config: {e}")
            self.agents_config = {"trackpal_agent": {
                "name": "TrackPal",
                "role": "Job Application Tracker",
                "goal": "Help users track and manage their job applications",
                "backstory": "An AI assistant specialized in job application tracking and insights",
                "verbose": True
            }}
        
        # Load tasks config
        tasks_path = os.path.join(current_dir, self.tasks_config_path)
        try:
            with open(tasks_path, 'r') as f:
                self.tasks_config = yaml.safe_load(f)
        except Exception as e:
            print(f"Error loading tasks config: {e}")
            self.tasks_config = {
                "check_reminders_task": {
                    "description": "Analyze job applications and provide personalized reminders",
                    "expected_output": "List of personalized reminders and suggestions for job applications.",
                    "agent": "trackpal_agent"
                },
                "analyze_patterns_task": {
                    "description": "Identify patterns in job applications and provide insights",
                    "expected_output": "Analysis of application patterns and strategic advice.",
                    "agent": "trackpal_agent"
                }
            }
    
    @agent
    def trackpal_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['trackpal_agent'],
            llm=llm,
            verbose=True
        )
    
    def _format_applications(self, applications):
        # Helper method to format applications for tasks
        if not applications:
            return "No applications found."
            
        formatted_apps = []
        for app in applications:
            try:
                # Safely access dictionary values with get() method
                company = app.get('company', 'Unknown')
                position = app.get('position', 'Unknown')
                status = app.get('status', 'Unknown')
                days_since_applied = app.get('days_since_applied', 'Unknown')
                days_until_followup = app.get('days_until_followup')
                notes = app.get('notes', '')
                
                followup_text = f"Follow-up in {days_until_followup} days, " if days_until_followup is not None else ""
                
                app_text = f"Company: {company}, Position: {position}, Status: {status}, "
                app_text += f"Applied: {days_since_applied} days ago, {followup_text}"
                app_text += f"Notes: {notes}"
                
                formatted_apps.append(app_text)
            except Exception as e:
                # If there's an error formatting an application, add a placeholder
                formatted_apps.append(f"Error formatting application: {str(e)}")
        
        return "\n".join(formatted_apps)
    
    def create_check_reminders_task(self, user_id: str) -> Task:
        # Get applications for the user
        applications = self.application_manager.get_applications(user_id)
        apps_text = self._format_applications(applications)
        
        task_description = f"""
            Here are the job applications for user '{user_id}':

            {apps_text}

            Your job is to analyze these applications and provide personalized reminders:
            1. For applications with status APPLIED older than 10 days with no response, suggest following up
            2. For upcoming interviews, remind the user to prepare
            3. For applications with follow-up dates approaching, remind the user
            4. If there are multiple rejections (3+), suggest getting resume feedback

            IMPORTANT: Your response must be in the following format:
            - Start with a brief greeting
            - List each reminder as a bullet point
            - End with a brief encouragement
            - DO NOT include any "Thought:" or internal reasoning in your response
            - DO NOT include any metadata or prefixes like "Response:" or "Answer:"
            
            Respond in a friendly, motivational tone with a clear, concise list of actionable reminders.
            If there are no reminders needed, provide encouragement about their job search.
        """
        
        return Task(
            description=task_description,
            expected_output="List of personalized reminders and suggestions for job applications.",
            agent=self.trackpal_agent()
        )
    
    def create_analyze_patterns_task(self, user_id: str) -> Task:
        # Get applications for the user
        applications = self.application_manager.get_applications(user_id)
        apps_text = self._format_applications(applications)
        
        task_description = f"""
            Here are the job applications for user '{user_id}':

            {apps_text}

            Your job is to analyze these applications and identify patterns to provide strategic advice.
            Look for:
            1. Types of positions they're applying to and any patterns
            2. Success rate for different types of applications
            3. Time between application stages
            4. Any potential issues in their job search strategy

            Provide insights on:
            - Strengths in their current approach
            - Potential weaknesses or blind spots
            - Recommendations for improving their job search
            - Suggestions for resume or career focus shifts if needed

            IMPORTANT: Your response must be in the following format:
            - Start with a brief introduction of your analysis
            - Organize insights into clearly labeled sections
            - End with 2-3 specific actionable recommendations
            - DO NOT include any "Thought:" or internal reasoning in your response
            - DO NOT include any metadata or prefixes like "Response:" or "Answer:"

            Be honest but encouraging. Focus on actionable insights that can improve their job search outcomes.
        """
        
        return Task(
            description=task_description,
            expected_output="Analysis of application patterns and strategic advice.",
            agent=self.trackpal_agent()
        )
    
    def crew(self, task_type: str = "check_reminders", user_id: str = "test_user") -> Crew:
        # Create the agent
        agent = self.trackpal_agent()
        
        # Create the appropriate task with the user data
        if task_type == "check_reminders":
            task = self.create_check_reminders_task(user_id)
        else:  # analyze_patterns
            task = self.create_analyze_patterns_task(user_id)
            
        # Create and return the crew
        return Crew(
            agents=[agent],
            tasks=[task],
            verbose=True
        )

# Helper function to clean AI responses
def clean_ai_response(response):
    """Remove any 'Thought:' text and other unwanted patterns from AI responses"""
    # Remove any line starting with 'Thought:' and everything after it until a blank line
    import re
    cleaned = re.sub(r'\nThought:.*?(\n\n|$)', r'\n\n', response, flags=re.DOTALL)
    # Remove standalone 'Thought:' lines
    cleaned = re.sub(r'^Thought:.*?$', '', cleaned, flags=re.MULTILINE)
    # Remove any other metadata prefixes
    cleaned = re.sub(r'^(Response:|Answer:|Final Answer:)\s*', '', cleaned, flags=re.MULTILINE)
    return cleaned.strip()

# Direct LLM function for simple API calls without using CrewAI
def respond(message):
    """Send a direct message to the Ollama LLM and get a response"""
    formatted_message = f"""
    {message}
    
    IMPORTANT: Your response must be clear and direct.
    - DO NOT include any "Thought:" or internal reasoning in your response
    - DO NOT include any metadata or prefixes like "Response:" or "Answer:"
    - Respond in a friendly, helpful tone
    - Be concise and to the point
    """
    
    response = litellm.completion(
        model="ollama/llama3.2",
        api_base="http://ollama:11434",
        messages=[{"role": "user", "content": formatted_message}]
    )
    raw_response = response.choices[0].message.content
    return clean_ai_response(raw_response)
