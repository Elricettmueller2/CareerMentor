"""
Skills Matcher Module für den Path Finder Agent

Dieses Modul enthält Funktionen zum Analysieren von Jobanforderungen und zum Vergleichen
von Benutzerprofilen mit Jobanforderungen.
"""
import json
from typing import Dict, List, Any
import litellm
from crews.path_finder.search_path import get_job_details

def analyze_job_requirements(job_id: str) -> Dict[str, Any]:
    """
    Analysiert die Anforderungen und Qualifikationen für eine bestimmte Stellenausschreibung
    und extrahiert wichtige Fähigkeiten, Erfahrungsstufen, Bildungsanforderungen und andere Kriterien.
    
    Args:
        job_id: Die ID der zu analysierenden Stellenausschreibung
        
    Returns:
        Eine strukturierte Analyse der Jobanforderungen
    """
    print(f"Analyzing job requirements for job ID: {job_id}")
    
    # Job-Details abrufen
    job_details = get_job_details(job_id)
    
    if not job_details:
        return {"error": f"Job with ID {job_id} not found"}
    
    # Prompt für die KI erstellen
    prompt = f"""
    Analyze the following job posting and extract the key requirements and qualifications:
    
    Job Title: {job_details.get('title', 'Unknown')}
    Company: {job_details.get('company', 'Unknown')}
    Description: {job_details.get('description', '')}
    Requirements: {job_details.get('requirements', '')}
    
    Please extract and categorize the following information:
    1. Technical Skills: List all technical skills required for this job
    2. Soft Skills: List all soft skills mentioned or implied
    3. Education: Required education level and field of study
    4. Experience: Years of experience required and in which areas
    5. Languages: Required language skills
    6. Certifications: Any certifications that are required or preferred
    7. Tools/Software: Specific tools or software mentioned
    8. Industry Knowledge: Specific industry knowledge required
    
    Format your response as a structured JSON object with these categories as keys.
    """
    
    # KI-Anfrage stellen
    try:
        response = litellm.completion(
            model="ollama/llama3.2", 
            api_base="http://host.docker.internal:65201",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=1000
        )
        
        # Antwort extrahieren und als JSON parsen
        ai_response = response.choices[0].message.content
        
        # Versuchen, die Antwort als JSON zu parsen
        try:
            analysis = json.loads(ai_response)
        except json.JSONDecodeError:
            # Wenn die Antwort kein gültiges JSON ist, geben wir die Rohantwort zurück
            analysis = {"raw_analysis": ai_response}
        
        # Job-Details zur Analyse hinzufügen
        analysis["job_id"] = job_id
        analysis["job_title"] = job_details.get("title")
        analysis["company"] = job_details.get("company")
        
        return analysis
        
    except Exception as e:
        print(f"Error analyzing job requirements: {str(e)}")
        return {
            "error": f"Failed to analyze job requirements: {str(e)}",
            "job_id": job_id
        }

def compare_skills_to_job(user_profile: Dict[str, Any], job_ids: List[str]) -> Dict[str, Any]:
    """
    Vergleicht die Fähigkeiten und Qualifikationen des Benutzers mit den Anforderungen
    bestimmter Stellenausschreibungen und liefert eine Match-Bewertung und Verbesserungsvorschläge.
    
    Args:
        user_profile: Das Profil des Benutzers mit Fähigkeiten und Qualifikationen
        job_ids: Eine Liste von Job-IDs zum Vergleich
        
    Returns:
        Eine Match-Analyse für jeden Job mit Prozent-Match, Stärken, Lücken und Verbesserungsvorschlägen
    """
    print(f"Comparing user skills with {len(job_ids)} jobs")
    
    results = []
    
    for job_id in job_ids:
        # Job-Details abrufen
        job_details = get_job_details(job_id)
        
        if not job_details:
            results.append({
                "job_id": job_id,
                "error": f"Job with ID {job_id} not found"
            })
            continue
        
        # Prompt für die KI erstellen
        prompt = f"""
        Compare the user's profile with the job requirements and provide a match analysis:
        
        USER PROFILE:
        - Education: {user_profile.get('education', 'Not specified')}
        - Skills: {', '.join(user_profile.get('skills', []))}
        - Experience: {user_profile.get('experience', 'Not specified')}
        - Languages: {', '.join(user_profile.get('languages', []))}
        - Interests: {', '.join(user_profile.get('interests', []))}
        
        JOB DETAILS:
        - Title: {job_details.get('title', 'Unknown')}
        - Company: {job_details.get('company', 'Unknown')}
        - Description: {job_details.get('description', '')}
        - Requirements: {job_details.get('requirements', '')}
        
        Please provide the following analysis:
        1. Match Percentage: A percentage indicating how well the user's profile matches the job requirements
        2. Strengths: List the user's strengths that align well with the job requirements
        3. Gaps: List the areas where the user lacks required skills or experience
        4. Improvement Suggestions: Specific actions the user can take to improve their match for this job
        
        Format your response as a structured JSON object with these categories as keys.
        """
        
        # KI-Anfrage stellen
        try:
            response = litellm.completion(
                model="ollama/llama3.2", 
                api_base="http://host.docker.internal:65201",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=1000
            )
            
            # Antwort extrahieren und als JSON parsen
            ai_response = response.choices[0].message.content
            
            # Versuchen, die Antwort als JSON zu parsen
            try:
                analysis = json.loads(ai_response)
            except json.JSONDecodeError:
                # Wenn die Antwort kein gültiges JSON ist, geben wir die Rohantwort zurück
                analysis = {"raw_analysis": ai_response}
            
            # Job-Details zur Analyse hinzufügen
            analysis["job_id"] = job_id
            analysis["job_title"] = job_details.get("title")
            analysis["company"] = job_details.get("company")
            
            results.append(analysis)
                
        except Exception as e:
            print(f"Error comparing skills to job {job_id}: {str(e)}")
            results.append({
                "job_id": job_id,
                "error": f"Failed to compare skills: {str(e)}"
            })
    
    return {"matches": results}

# Für Testzwecke
if __name__ == "__main__":
    test_job_id = "MOCK-GOOGLE-ff3d0523"
    test_user_profile = {
        "education": "Bachelor in Computer Science",
        "skills": ["Python", "JavaScript", "SQL", "Data Analysis"],
        "experience": "2 years as Junior Developer",
        "languages": ["English", "German"],
        "interests": ["AI", "Machine Learning", "Web Development"]
    }
    
    print("\n=== Job Requirements Analysis ===")
    print(json.dumps(analyze_job_requirements(test_job_id), indent=2))
    
    print("\n=== Skills Match Analysis ===")
    print(json.dumps(compare_skills_to_job(test_user_profile, [test_job_id]), indent=2))
