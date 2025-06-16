from crews.resume_refiner.crew import ResumeRefinerCrew

def run_upload(file):
    """Save uploaded file and return upload_id"""
    crew = ResumeRefinerCrew()
    return crew.save_upload(file)

def run_parse(upload_id):
    """Parse PDF and extract sections"""
    crew = ResumeRefinerCrew()
    return crew.parse_pdf(upload_id)

def run_analyze_layout(upload_id):
    """Analyze PDF layout"""
    crew = ResumeRefinerCrew()
    return crew.analyze_pdf_layout(upload_id)

def run_evaluate(upload_id):
    """Evaluate resume quality with layout analysis"""
    crew = ResumeRefinerCrew()
    
    # Get parsed resume data
    resume_data = crew.parse_pdf(upload_id)
    
    # Get layout data
    layout_data = crew.analyze_pdf_layout(upload_id)
    
    # Evaluate quality
    return crew.evaluate_quality(resume_data, layout_data)

def run_match(upload_id, job_descriptions):
    """Match resume against job descriptions"""
    crew = ResumeRefinerCrew()
    
    # Get parsed resume data
    resume_data = crew.parse_pdf(upload_id)
    
    # Convert single job text to list of job descriptions if needed
    if isinstance(job_descriptions, str):
        job_descriptions = [{"id": "job1", "title": "Job Position", "description": job_descriptions}]
    
    # Match jobs
    return crew.match_jobs(resume_data, job_descriptions)