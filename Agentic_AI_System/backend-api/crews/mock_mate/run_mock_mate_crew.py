from crews.mock_mate.crew import respond, MockInterviewCrew

def run_respond_to_answer(user_response):
    return respond(user_response)

def run_start_interview(job_role, experience_level):
    crew = MockInterviewCrew().crew()
    result = crew.kickoff(inputs={
        "job_role": job_role,
        "experience_level": experience_level
    })
    
    return result.raw

def run_review_interview(interview_history):
    crew = MockInterviewCrew().crew()
    result = crew.kickoff(inputs={
        "interview_history": interview_history
    })
    
    return result.raw
