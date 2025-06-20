from crews.mock_mate.crew import MockInterviewCrew
from services.session_manager import get_conversation_history

def run_start_interview(job_role, experience_level):
    mock_crew = MockInterviewCrew()
    crew = mock_crew.crew()
    crew.tasks = [mock_crew.start_interview_task()]
    result = crew.kickoff(inputs={
        "job_role": job_role,
        "experience_level": experience_level
    })
    
    return result.raw

def run_respond_to_answer(user_respond, session_id):
    mock_crew = MockInterviewCrew()
    crew = mock_crew.crew()
    crew.tasks = [mock_crew.respond_to_answer_task()]
    conversation = get_conversation_history(session_id)
    result = crew.kickoff(inputs={
        "interview_history": conversation,
        "user_response": user_respond
    })

    return result.raw

def run_refine_answer(answer):
    mock_crew = MockInterviewCrew()
    crew = mock_crew.crew()
    crew.tasks = [mock_crew.refine_answer_task()]
    result = crew.kickoff(inputs={
        "answer": answer
    })
    return result.raw

def run_review_interview(interview_history):
    mock_crew = MockInterviewCrew()
    crew = mock_crew.crew()
    crew.tasks = [mock_crew.review_interview_task()]
    result = crew.kickoff(inputs={
        "interview_history": interview_history
    })
    
    return result.raw
