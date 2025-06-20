from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
from crews.path_finder.job_scraper import search_jobs_online

app = FastAPI()

# CORS-Middleware hinzufügen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Erlaubt alle Ursprünge für die Entwicklung
    allow_credentials=True,
    allow_methods=["*"],  # Erlaubt alle Methoden
    allow_headers=["*"],  # Erlaubt alle Header
)

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
    print(f"Received search request: {request}")
    try:
        data = request.data
        print(f"Request data: {data}")
        
        result = search_jobs_online(
            job_title=data["job_title"],
            education_level=data["education_level"],
            years_experience=data["years_experience"],
            location_radius=data["location_radius"],
            interest_points=data["interest_points"]
        )
        
        # Überprüfe, ob result ein Dictionary oder eine Liste ist
        if isinstance(result, dict) and "jobs" in result:
            jobs = result["jobs"]
            print(f"Search results count: {len(jobs) if jobs else 0}")
            print(f"First result sample: {jobs[0] if jobs and len(jobs) > 0 else 'No results'}")
            response = result  # Gib das Dictionary direkt zurück
        else:
            # Behandle result als Liste von Jobs
            print(f"Search results count: {len(result) if result else 0}")
            print(f"First result sample: {result[0] if result and len(result) > 0 else 'No results'}")
            response = {"jobs": result}
        
        print(f"Returning response with structure: {list(response.keys())}")
        print(f"Jobs type: {type(response.get('jobs', [])).__name__}")
        return response
    except Exception as e:
        print(f"Error in search_jobs_online_frontend: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error searching for jobs: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
