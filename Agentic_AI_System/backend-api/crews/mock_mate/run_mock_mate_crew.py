from crews.mock_mate.crew import MockInterviewCrew
from services.session_manager import get_conversation_history, get_session_metadata

def run_start_interview(job_title, experience_level, interview_type="Technical", company_culture="Balanced"):
    mock_crew = MockInterviewCrew()
    crew = mock_crew.crew()
    
    # Select the appropriate agent based on interview_type
    if interview_type.lower() == "technical":
        crew.agents = [mock_crew.technical_interviewer()]
    else:
        crew.agents = [mock_crew.behavioral_interviewer()]
    
    crew.tasks = [mock_crew.start_interview_task()]
    result = crew.kickoff(inputs={
        "job_title": job_title,
        "experience_level": experience_level,
        "interview_type": interview_type,
        "company_culture": company_culture
    })
    
    return result.raw

def run_respond_to_answer(user_response, session_id):
    mock_crew = MockInterviewCrew()
    crew = mock_crew.crew()
    
    conversation = get_conversation_history(session_id)
    metadata = get_session_metadata(session_id)
    job_title = metadata.get("job_title")
    interview_type = metadata.get("interview_type", "Technical")
    current_phase = metadata.get("current_phase", "technical_assessment")
    
    # Select the appropriate agent based on interview_type
    if interview_type.lower() == "technical":
        crew.agents = [mock_crew.technical_interviewer()]
    else:
        crew.agents = [mock_crew.behavioral_interviewer()]
    
    crew.tasks = [mock_crew.respond_to_answer_task()]
    result = crew.kickoff(inputs={
        "interview_history": conversation,
        "user_response": user_response,
        "job_title": job_title,
        "current_phase": current_phase
    })

    return result.raw

def run_review_interview(interview_transcript, job_requirements=None):
    mock_crew = MockInterviewCrew()
    crew = mock_crew.crew()
    
    # Use the feedback coach for interview reviews
    crew.agents = [mock_crew.feedback_coach()]
    crew.tasks = [mock_crew.review_interview_task()]
    
    result = crew.kickoff(inputs={
        "interview_transcript": interview_transcript,
        "job_requirements": job_requirements or {}
    })
    
    return result.raw

def run_prepare_custom_interview(job_description, required_skills, candidate_background=None):
    mock_crew = MockInterviewCrew()
    crew = mock_crew.crew()
    
    # Use the technical interviewer for interview preparation
    crew.agents = [mock_crew.technical_interviewer()]
    crew.tasks = [mock_crew.prepare_custom_interview_task()]
    
    result = crew.kickoff(inputs={
        "job_description": job_description,
        "required_skills": required_skills,
        "candidate_background": candidate_background or {}
    })
    
    return result.raw