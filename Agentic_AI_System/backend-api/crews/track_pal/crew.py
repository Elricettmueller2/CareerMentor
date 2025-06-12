from crewai import Crew, Agent, Task
from textwrap import dedent

# Dummy tool that mimics database access for applications
class ApplicationFetcher:
    def get_applications(self, user_id):
        # Dummy data
        return [
            {"company": "Acme Corp", "title": "UI Designer", "applied_days_ago": 12},
            {"company": "Globex", "title": "Frontend Dev", "applied_days_ago": 5},
            {"company": "Initech", "title": "Product Manager", "applied_days_ago": 16},
        ]

# Create an instance of the fetcher
application_fetcher = ApplicationFetcher()

# Agent definition
reminder_agent = Agent(
    role="Reminder Assistant",
    goal="Help users remember when to follow up on job applications.",
    backstory=dedent("""\
        You're an assistant that helps job seekers track their applications.
        If they applied more than 10 days ago and didn't get a response, you suggest following up.
    """),
    verbose=True,
    allow_delegation=False
)

# Function to get applications data
def get_applications_data(user_id: str):
    # Get applications using our fetcher
    applications = application_fetcher.get_applications(user_id)
    # Return formatted data for the agent
    return "\n".join([f"Company: {app['company']}, Position: {app['title']}, Applied: {app['applied_days_ago']} days ago" 
                    for app in applications])

# Task that analyzes application dates
def get_task(user_id: str):
    # Get the applications data
    applications_data = get_applications_data(user_id)
    
    return Task(
        description=dedent(f"""\
            Here are the job applications for user '{user_id}':
            
            {applications_data}
            
            For any application older than 10 days, suggest a follow-up action.
            Respond in friendly, motivational tone with a short list.
        """),
        agent=reminder_agent,
        expected_output="List of applications with follow-up suggestions.",
        async_execution=False
    )

# Crew factory function
def get_crew(user_id: str):
    return Crew(
        agents=[reminder_agent],
        tasks=[get_task(user_id)],
        verbose=True
    )
