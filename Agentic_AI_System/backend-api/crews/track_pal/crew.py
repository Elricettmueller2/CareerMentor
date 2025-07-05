from crewai import Agent, Task, Crew, LLM
from crewai.project import CrewBase, agent, task, crew
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List, Dict, Any, Optional
import os
import json
from datetime import datetime, timedelta
import litellm
from services.mongodb.global_state_service import global_state

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

# Application data storage and retrieval using MongoDB
class ApplicationManager:
    def __init__(self):
        """Initialize the application manager using MongoDB global state service"""
        pass
    
    def get_applications(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all applications for a user from MongoDB"""
        try:
            # Get the global state for the user
            state = global_state.get_state(user_id)
            
            # Extract applications from agent_knowledge
            applications = state.get('agent_knowledge', {}).get('applications', {})
            
            # Convert from dict to list if needed (MongoDB stores as dict with ID keys)
            if isinstance(applications, dict):
                return list(applications.values())
            elif isinstance(applications, list):
                return applications
            else:
                return []
                
        except Exception as e:
            print(f"Error loading applications from MongoDB: {e}")
            return []
    
    def save_application(self, user_id: str, application: Dict[str, Any]) -> Dict[str, Any]:
        """Save a new application to MongoDB"""
        try:
            # Get current state and applications
            state = global_state.get_state(user_id)
            
            # Ensure agent_knowledge and applications exist
            if 'agent_knowledge' not in state:
                state['agent_knowledge'] = {}
            
            if 'applications' not in state['agent_knowledge']:
                state['agent_knowledge']['applications'] = {}
            
            # Generate ID if not provided
            if "id" not in application:
                # Use timestamp-based ID to ensure uniqueness
                application["id"] = f"app_{int(datetime.now().timestamp())}"
            
            # Set default status if not provided
            if "status" not in application:
                application["status"] = SAVED
            
            # Add timestamp
            application["created_at"] = datetime.now().isoformat()
            application["updated_at"] = application["created_at"]
            
            # Add to applications dict with ID as key
            state['agent_knowledge']['applications'][application["id"]] = application
            
            # Save updated state
            global_state.set_state(state, user_id)
            
            return application
            
        except Exception as e:
            print(f"Error saving application to MongoDB: {e}")
            return application  # Return the application anyway for client-side use
    
    def update_application(self, user_id: str, app_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing application in MongoDB"""
        try:
            # Get current state
            state = global_state.get_state(user_id)
            
            # Check if applications exist
            if 'agent_knowledge' not in state or 'applications' not in state['agent_knowledge']:
                return None
                
            applications = state['agent_knowledge']['applications']
            
            # Check if application exists
            if app_id not in applications:
                return None
                
            # Update fields
            for key, value in updates.items():
                applications[app_id][key] = value
            
            # Update timestamp
            applications[app_id]["updated_at"] = datetime.now().isoformat()
            
            # Save updated state
            global_state.set_state(state, user_id)
            
            return applications[app_id]
            
        except Exception as e:
            print(f"Error updating application in MongoDB: {e}")
            return None

# Initialize LLM with Ollama
llm = LLM(
    model="ollama/llama3.2",
    base_url=os.getenv("OLLAMA_BASE_URL", "http://ollama:11434"),
)

@CrewBase
class TrackPalCrew():
    agents: List[BaseAgent]
    tasks: List[Task]
    agents_config_path = "config/agents.yaml"
    tasks_config_path = "config/tasks.yaml"
    
    def __init__(self):
        # Initialize application manager with MongoDB backend
        self.application_manager = ApplicationManager()
        
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
    
    def create_check_reminders_task(self, user_id: str, applications: List[Dict[str, Any]] = None) -> Task:
        # Use provided applications if available, otherwise get from storage
        if applications is None:
            applications = self.application_manager.get_applications(user_id)
        apps_text = self._format_applications(applications)
        
        task_description = f"""
            Here are the job applications:

            {apps_text}

            Analyze these job applications and create personalized reminders. Focus on:
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
            - CRITICAL: NEVER mention "test_user" or any username in your responses
            - Do not refer to the user's identity at all
            
            Respond in a friendly, motivational tone with a clear, concise list of actionable reminders.
            If there are no reminders needed, provide encouragement about their job search.
        """
        
        return Task(
            description=task_description,
            expected_output="List of personalized reminders and suggestions for job applications.",
            agent=self.trackpal_agent()
        )
    
    def create_analyze_patterns_task(self, user_id: str, applications: List[Dict[str, Any]] = None) -> Task:
        # Use provided applications if available, otherwise get from storage
        if applications is None:
            applications = self.application_manager.get_applications(user_id)
        apps_text = self._format_applications(applications)
        
        task_description = f"""
            Here are the job applications:

            {apps_text}

            Based on the job application data, generate up to 3 concise and actionable insights. Each insight should be short (1–2 sentences), clear, and suggest a next step. Do not repeat background data or job titles unnecessarily. Do not include markdown formatting like **bold** or *italics*. Each insight should stand alone and be understandable at a glance.

            Only focus on:
            - Patterns in job titles, sectors, or companies applied to
            - Time between application and responses
            - Missed follow-ups
            - Resume version effectiveness (if available)
            - Suggested next actions

            Output each insight as a standalone string for display in a card.

            Avoid:
            - Repeating job titles more than once
            - Explaining what "this might mean"
            - Long analysis or context
            - Generic advice (e.g., "Stay consistent")
            - NEVER mention "test_user" or any username in your responses
            - Do not refer to the user's identity at all

            IMPORTANT: Your response must be in the following format:
            - Each insight should be on its own line
            - No more than 3 insights total
            - No introduction, conclusion, or additional context
            - DO NOT include any "Thought:" or internal reasoning in your response
            - DO NOT include any metadata or prefixes like "Response:" or "Answer:"
            - DO NOT use bullet points or numbering
        """
        
        return Task(
            description=task_description,
            expected_output="Analysis of application patterns and strategic advice.",
            agent=self.trackpal_agent()
        )
    
    def crew(self, task_type: str = "check_reminders", user_id: str = "test_user", applications: List[Dict[str, Any]] = None) -> Crew:
        # Create the agent
        agent = self.trackpal_agent()
        
        # Create the appropriate task with the user data
        if task_type == "check_reminders":
            task = self.create_check_reminders_task(user_id, applications)
        else:  # analyze_patterns
            task = self.create_analyze_patterns_task(user_id, applications)
            
        # Create and return the crew
        return Crew(
            agents=[agent],
            tasks=[task],
            verbose=True
        )

# Helper function to clean AI responses
def clean_ai_response(response):
    """Clean AI responses to extract only the actionable insights without formatting"""
    import re
    
    # First, remove any markdown formatting
    cleaned = re.sub(r'\*\*|\*|__|\_\_|\_|\#\#|\#', '', response)
    
    # Remove any line starting with 'Thought:' and everything after it until a blank line
    cleaned = re.sub(r'\nThought:.*?(\n\n|$)', r'\n\n', cleaned, flags=re.DOTALL)
    
    # Remove common prefixes and headers
    patterns_to_remove = [
        r'^Thought:.*?$',
        r'^(Response:|Answer:|Final Answer:)\s*',
        r'^Here\'s my analysis.*?$',
        r'^.*?analysis and strategic advice:.*?$',
        r'^.*?Pattern(s)? Analysis.*?$',
        r'^.*?Application Patterns and Insights.*?$',
        r'^The user has applied.*?$',
        r'^After analyzing.*?$',
        r'^Based on.*?analysis.*?$',
        r'^Your final answer.*?$'
    ]
    
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, '', cleaned, flags=re.MULTILINE | re.IGNORECASE)
    
    # Parse the structured insights
    insight_pattern = r'Insight #\d+:.*?\n(.*?)(?=\n\s*Insight #\d+:|$)'
    matches = re.findall(insight_pattern, cleaned, re.DOTALL)
    
    # Process each insight description (skip the title)
    actionable_insights = []
    for match in matches:
        # Get the description part (after the title line)
        description_lines = [line.strip() for line in match.strip().split('\n')]
        description_lines = [line for line in description_lines if line and len(line) > 15]
        
        if description_lines:
            description = description_lines[0]  # Take the first line after the title
            
            # Skip negative insights that tell users what NOT to do
            if re.search(r'\b(no need|don\'t|do not|shouldn\'t|not necessary)\b', description, re.IGNORECASE):
                continue
                
            # Skip insights suggesting follow-ups for rejected or accepted applications
            if re.search(r'\b(follow.?up|reach.?out|contact|email)\b.*\b(rejected|declined|accepted|offer)\b', description, re.IGNORECASE):
                continue
                
            actionable_insights.append(description)
    
    # If we have more than 3 insights, take only the first 3
    if len(actionable_insights) > 3:
        actionable_insights = actionable_insights[:3]
    
    # If we don't have any actionable insights, return an empty string
    # This will trigger the "No insights available" message in the frontend
    if len(actionable_insights) == 0:
        return ''
    
    # Join the insights with newlines
    return '\n'.join(actionable_insights)


# Function removed - no longer needed for default insights

# Direct LLM function for simple API calls without using CrewAI
def respond(message):
    """Send a direct message to the Ollama LLM and get a response"""
    formatted_message = f"""
    {message}
    
    CRITICAL INSTRUCTIONS - READ CAREFULLY:
    
    1. FORMAT REQUIREMENTS:
       - You MUST generate EXACTLY 3 insights with the following structure:
         Insight #1: [Title of the first insight]
         [1-2 sentence description of the insight with actionable advice]
         
         Insight #2: [Title of the second insight]
         [1-2 sentence description of the insight with actionable advice]
         
         Insight #3: [Title of the third insight]
         [1-2 sentence description of the insight with actionable advice]
       - Each insight must have a clear title after "Insight #N:" and a 1-2 sentence description below it
       - NO additional introductions, conclusions, or explanations
       - NO markdown formatting, bullets, or numbering (except the insight titles)
    
    2. CONTENT REQUIREMENTS:
       - Each insight MUST be positive and actionable with a clear next step
       - Each insight MUST be unique and different from the others
       - Focus on job application patterns, response times, follow-ups, or resume effectiveness
       - ONLY suggest productive actions the user CAN take (use action verbs)
       - NEVER tell the user what they DON'T need to do
       - NEVER use phrases like "no need to", "don't worry", or "not necessary"
       - NEVER suggest following up with applications that have been rejected or accepted
       - Only suggest follow-ups for applications that are still pending or in progress
       - If there isn't enough data, provide general job search advice
    
    3. EXAMPLE FORMAT (create your own unique insights, don't copy these):
       Insight #1: Target High-Response Industries
       Focus on applying to UX design roles where you've had the most interview success.
       
       Insight #2: Follow Up on Pending Applications
       Send follow-up emails to the 3 companies with pending applications that haven't responded in over 10 days.
       
       Insight #3: Highlight Key Skills
       Emphasize your project management skills more prominently on your resume to attract more interviews.
    
    YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT WITH 3 INSIGHTS.
    """
    
    # Use the same environment variable as the CrewAI LLM
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    
    response = litellm.completion(
        model="ollama/llama3.2",
        api_base=ollama_base_url,
        messages=[{"role": "user", "content": formatted_message}],
        temperature=0.5  # Lower temperature for more consistent outputs
    )
    raw_response = response.choices[0].message.content
    return clean_ai_response(raw_response)
