from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
from crews.path_finder.job_scraper import search_jobs_online

app = FastAPI()

class JobSearchRequest(BaseModel):
    job_title: str
    education_level: str
    years_experience: int
    location_radius: int
    interest_points: List[str]
    location: Optional[Dict[str, float]] = None

class FrontendRequest(BaseModel):
    data: Dict[str, Any]

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "CareerMentor Path Finder API"}

@app.post("/api/path_finder/search_jobs")
def search_jobs(request: JobSearchRequest):
    try:
        result = search_jobs_online(
            job_title=request.job_title,
            education_level=request.education_level,
            years_experience=request.years_experience,
            location_radius=request.location_radius,
            interest_points=request.interest_points
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching for jobs: {str(e)}")

@app.post("/agents/path_finder/search_jobs_online")
def search_jobs_online_frontend(request: FrontendRequest = Body(...)):
    try:
        data = request.data
        result = search_jobs_online(
            job_title=data["job_title"],
            education_level=data["education_level"],
            years_experience=data["years_experience"],
            location_radius=data["location_radius"],
            interest_points=data["interest_points"]
        )
        return {"jobs": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching for jobs: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
