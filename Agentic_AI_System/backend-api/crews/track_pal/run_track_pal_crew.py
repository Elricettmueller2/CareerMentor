from .crew import get_crew

def run_check_reminders(user_id: str) -> str:
    crew = get_crew(user_id)
    result = crew.kickoff()
    return result
