from .job_scraper import job_scraper_instance 
from typing import Dict, Any, List
from services.mongodb.mongodb_pathfinder_utils import (
    save_job_for_user,
    unsave_job_for_user,
    get_saved_jobs_for_user,
    add_search_history,
    get_search_history_for_user,
    is_job_saved
)
import litellm
import json
import uuid
import re 
import random

def suggest_roles(query: str) -> Dict[str, Any]:
    """
    Generate search suggestions. Currently returns empty as GoogleJobsScraper doesn't support this directly.
    
    Args:
        query: The partial search query
        
    Returns:
        Dictionary with suggestions
    """
    return {"suggestions": []}


def search_jobs_online(job_title: str = "", degree: str = "", hard_skills_rating: int = 5, 
                      soft_skills_rating: int = 5, interests: str = "", 
                      user_id: str = None, limit: int = 10, location: str = "Deutschland") -> Dict[str, Any]:
    """
    Search for jobs by scraping ~100 listings and then filtering them using Ollama AI.
    
    Args:
        job_title: The job title or role the user is interested in
        degree: The highest degree achieved by the user
        hard_skills_rating: Self-assessment of hard skills (1-10)
        soft_skills_rating: Self-assessment of soft skills (1-10)
        interests: General interests of the user
        user_id: Optional user ID to track search history
        limit: Maximum number of final results to return (after AI filtering)
        location: The location to search for jobs in (defaults to Deutschland)
        
    Returns:
        Dictionary with job listings
    """
    search_query_for_history = job_title if job_title else interests
    if user_id and search_query_for_history:
        add_search_history(user_id, search_query_for_history)
    
    scraper_query = job_title if job_title else interests
    if not scraper_query: 
        scraper_query = "entry level" 

    print(f"Step 1: Scraping jobs for query: '{scraper_query}' in location: '{location}'")
    try:
        scraped_jobs = job_scraper_instance.search_jobs(query=scraper_query, location=location, num_jobs_to_find=100)
    except Exception as e:
        print(f"Error during job scraping: {e}")
        scraped_jobs = []

    if not scraped_jobs:
        print("No jobs found by the scraper. Returning empty list.")
        return {"jobs": [], "count": 0, "message": "No jobs found by scraper."}
    
    print(f"Step 2: Found {len(scraped_jobs)} jobs. Now filtering with AI...")
    
    user_criteria = {
        "job_title": job_title,
        "degree": degree,
        "hard_skills_rating": hard_skills_rating,
        "soft_skills_rating": soft_skills_rating,
        "interests": interests
    }
    
    ai_filtered_jobs = filter_and_select_jobs_with_ai(
        user_criteria=user_criteria,
        scraped_jobs=scraped_jobs,
        limit=limit
    )
    
    if user_id:
        for job in ai_filtered_jobs:
            if "id" not in job or not job["id"]:
                job["id"] = f"AI-GEN-{str(uuid.uuid4())[:8]}"
            job["is_saved"] = is_job_saved(user_id, job["id"])
    
    return {"jobs": ai_filtered_jobs, "count": len(ai_filtered_jobs)}


def filter_and_select_jobs_with_ai(user_criteria: Dict[str, Any], 
                                   scraped_jobs: List[Dict[str, Any]], 
                                   limit: int = 10) -> List[Dict[str, Any]]:
    """
    Use Ollama to filter a list of scraped jobs based on user criteria and select the top N.
    Falls Ollama nicht verfügbar ist, wird ein einfacher Fallback-Mechanismus verwendet.
    
    Args:
        user_criteria: Dictionary of user's search preferences.
        scraped_jobs: List of job dictionaries obtained from the scraper.
        limit: Maximum number of jobs to select.
        
    Returns:
        List of selected job dictionaries.
    """
    
    summarized_jobs_for_prompt = []
    for job in scraped_jobs:
        summarized_jobs_for_prompt.append({
            "id": job.get("id", f"TEMP-{str(uuid.uuid4())[:8]}"), 
            "title": job.get("title", "N/A"),
            "company": job.get("company", "N/A"),
            "location": job.get("location", "N/A"),
            "description_snippet": job.get("description", "N/A")[:200] 
        })
    
    def fallback_filter_jobs():
        print("Using fallback job filtering mechanism without Ollama")
        # Einfache Filterung basierend auf Übereinstimmung mit Jobtitel und Interessen
        job_title = user_criteria.get('job_title', '').lower()
        interests = user_criteria.get('interests', '').lower()
        
        # Bewertungsfunktion für Jobs
        def score_job(job):
            score = 0
            # Titel-Übereinstimmung
            if job_title and job_title in job.get('title', '').lower():
                score += 40
            
            # Interessen-Übereinstimmung
            job_description = job.get('description', '').lower()
            if interests:
                interest_terms = [i.strip().lower() for i in interests.split(',')]
                for term in interest_terms:
                    if term and term in job_description:
                        score += 15
            
            return score
        
        # Bewerte alle Jobs und sortiere sie
        scored_jobs = [(job, score_job(job)) for job in scraped_jobs]
        scored_jobs.sort(key=lambda x: x[1], reverse=True)
        
        # Füge Bewertungen zu den Top-Jobs hinzu
        top_jobs = []
        for job, score in scored_jobs[:limit]:
            job_copy = job.copy()
            job_copy['match_score'] = min(100, score)
            job_copy['match_explanation'] = f"Job matches your search criteria with a score of {score}/100"
            top_jobs.append(job_copy)
        
        return top_jobs
    
    prompt = f"""
    Als erfahrener Karriereberater, analysiere bitte das folgende Benutzerprofil und die bereitgestellte Liste von Jobs.
    Wähle die {limit} passendsten Jobs aus der Liste aus, die am besten zum Benutzerprofil passen.

    Benutzerprofil:
    - Gewünschter Job-Titel: {user_criteria.get('job_title', 'Nicht angegeben')}
    - Höchster erreichter Abschluss: {user_criteria.get('degree', 'Nicht angegeben')}
    - Hard Skills Selbsteinschätzung (1-10): {user_criteria.get('hard_skills_rating', 'N/A')}
    - Soft Skills Selbsteinschätzung (1-10): {user_criteria.get('soft_skills_rating', 'N/A')}
    - Generelle Interessen: {user_criteria.get('interests', 'Nicht angegeben')}

    Liste der gefundenen Jobs (ID, Titel, Unternehmen, Standort, Kurzbeschreibung):
    {json.dumps(summarized_jobs_for_prompt, indent=2)}

    Deine Aufgabe:
    1. Gehe die Liste der Jobs durch.
    2. Wähle die {limit} Jobs aus, die am besten zum Benutzerprofil passen.
    3. Gib die ausgewählten Jobs als JSON-Array zurück. Jeder Job im Array sollte die ursprüngliche ID und alle anderen relevanten Felder aus der ursprünglichen Jobliste enthalten, die du für passend hältst (mindestens id, title, company, location, description). Ergänze ggf. Felder wie 'salary_range', 'employment_type', 'remote', 'skills', 'requirements', falls diese in den Originaldaten vorhanden waren und relevant sind.
    4. Stelle sicher, dass jeder zurückgegebene Job eine 'id' hat. Wenn die ursprüngliche ID 'TEMP-' enthält, generiere eine neue mit 'AI-SEL-'.

    Formatiere deine Antwort NUR als JSON-Array der ausgewählten Jobs.
    Beispiel für ein ausgewähltes Job-Objekt (verwende die Daten aus der bereitgestellten Liste):
    {{
        "id": "(original or new ID)",
        "title": "Job-Titel aus Liste",
        "company": "Unternehmen aus Liste",
        "location": "Standort aus Liste",
        "description": "(vollständige Beschreibung aus Originalliste oder Snippet)",
        "requirements": "(aus Originalliste, falls vorhanden)",
        "skills": "(aus Originalliste, falls vorhanden)",
        "salary_range": "(aus Originalliste, falls vorhanden)",
        "employment_type": "(aus Originalliste, falls vorhanden)",
        "remote": (true/false, aus Originalliste, falls vorhanden)
    }}
    """
    
    print(f"Prompting Ollama with {len(summarized_jobs_for_prompt)} summarized jobs for filtering.")

    try:
        response = litellm.completion(
            model="ollama/llama3.2", 
            api_base="http://host.docker.internal:65201",
            messages=[{"role": "user", "content": prompt}],
            timeout=120 
        )
        
        content = response.choices[0].message.content
        
        try:
            json_match = re.search(r'\[\s\S]*\]', content, re.DOTALL) 
            if json_match:
                json_str = json_match.group(0)
            else:
                json_match_obj = re.search(r'\{\s\S*\}', content, re.DOTALL)
                if json_match_obj:
                    json_str = json_match_obj.group(0)
                    if not json_str.strip().startswith('['):
                        json_str = f"[{json_str}]"
                else:
                    print("No JSON array or object found in Ollama response.")
                    raise json.JSONDecodeError("No JSON found", content, 0)
            
            selected_jobs_summary = json.loads(json_str)
            
            original_jobs_by_id = {job.get('id'): job for job in scraped_jobs if job.get('id')}
            
            final_selected_jobs = []
            for summary_job in selected_jobs_summary:
                original_id = summary_job.get('id')
                full_job_data = original_jobs_by_id.get(original_id)
                
                if full_job_data:
                    final_job = full_job_data.copy() 
                    if original_id and original_id.startswith("TEMP-"):
                        final_job["id"] = f"AI-SEL-{str(uuid.uuid4())[:8]}"
                    elif not original_id:
                         final_job["id"] = f"AI-SEL-{str(uuid.uuid4())[:8]}"
                    final_selected_jobs.append(final_job)
                else:
                    new_job = summary_job.copy()
                    if not new_job.get("id") or new_job.get("id", "").startswith("TEMP-"):
                        new_job["id"] = f"AI-GEN-{str(uuid.uuid4())[:8]}"
                    final_selected_jobs.append(new_job)
            
            return final_selected_jobs[:limit]
            
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON from Ollama filtering response: {e}")
            print(f"Raw Ollama response: {content}")
            return scraped_jobs[:limit]
            
    except Exception as e:
        print(f"Error calling Ollama API for filtering: {e}")
        return fallback_filter_jobs()

def get_job_details(job_id: str, user_id: str = None) -> Dict[str, Any]:
    """
    Get detailed information about a specific job.
    Uses the job_scraper_instance.
    """
    try:
        job = job_scraper_instance.get_job_details(job_id)
        if user_id and job:
            job["is_saved"] = is_job_saved(user_id, job_id)
        return {"job": job} if job else {"error": "Job not found"}
    except Exception as e:
        print(f"Error in get_job_details: {e}")
        return {"error": str(e)}

def save_job(user_id: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
    """Save a job for a user."""
    if 'id' not in job_data or not job_data['id']:
        job_data['id'] = f"SAVED-{str(uuid.uuid4())[:8]}" 
        
    saved_job = save_job_for_user(user_id, job_data)
    return {
        "success": True if saved_job else False,
        "message": "Job saved successfully" if saved_job else "Failed to save job",
        "job_id": saved_job.get('id') if saved_job else job_data['id']
    }

def unsave_job(user_id: str, job_id: str) -> Dict[str, Any]:
    """Remove a saved job for a user."""
    success = unsave_job_for_user(user_id, job_id)
    return {
        "success": success,
        "message": "Job removed successfully" if success else "Job not found or failed to remove",
        "job_id": job_id
    }

def get_saved_jobs(user_id: str) -> Dict[str, Any]:
    """Get all saved jobs for a user."""
    saved_jobs_list = get_saved_jobs_for_user(user_id)
    return {
        "saved_jobs": saved_jobs_list,
        "count": len(saved_jobs_list)
    }

def get_job_recommendations(user_id: str, limit: int = 3) -> Dict[str, Any]:
    """
    Get job recommendations based on user's saved jobs or search history.
    This is a simplified version and could be enhanced.
    """
    saved_jobs = get_saved_jobs_for_user(user_id)
    query_basis = "saved jobs"
    
    if not saved_jobs:
        search_history = get_search_history_for_user(user_id)
        if search_history:
            base_query = search_history[-1] if isinstance(search_history[-1], str) else search_history[-1].get('query', 'Software Developer')
            query_basis = f"search history: {base_query}"
        else:
            base_query = "Software Developer" 
            query_basis = "default software developer query"
    else:
        base_query = random.choice(saved_jobs).get('title', "Software Developer")
        query_basis = f"saved job title: {base_query}"

    print(f"Generating recommendations based on: {query_basis}")
    try:
        recommendations = job_scraper_instance.search_jobs(query=base_query, location="Deutschland", num_jobs_to_find=limit * 2) 
    except Exception as e:
        print(f"Error scraping for recommendations: {e}")
        recommendations = []

    final_recommendations = recommendations[:limit]
    
    for job in final_recommendations:
        if "id" not in job or not job["id"]:
            job["id"] = f"REC-{str(uuid.uuid4())[:8]}"
        job["is_saved"] = is_job_saved(user_id, job["id"])
    
    return {
        "recommendations": final_recommendations,
        "based_on": query_basis,
        "count": len(final_recommendations)
    }