from crews.resume_refiner.crew import ResumeRefinerCrew

def run_parse(upload_id):
    crew = ResumeRefinerCrew().crew()
    return crew.kickoff(inputs={"upload_id": upload_id}).raw

def run_refine(upload_id):
    crew = ResumeRefinerCrew().crew()
    return crew.kickoff(inputs={"upload_id": upload_id}).raw

def run_match(upload_id, job_text):
    crew = ResumeRefinerCrew().crew()
    return crew.kickoff(inputs={"upload_id": upload_id, "job_text": job_text}).raw