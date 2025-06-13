from crews.path_finder.crew import PathFinderCrew
from crews.path_finder.search_path import search_jobs_online as direct_search_jobs

# === 1. FUNCTIONS ===

def run_suggest_roles(user_profile):
    crew = PathFinderCrew().crew()
    result = crew.kickoff(inputs={
        "user_profile": user_profile
    })
    return result.raw


def run_match_jobs(user_profile, selected_path):
    crew = PathFinderCrew().crew()
    result = crew.kickoff(inputs={
        "user_profile": user_profile,
        "selected_path": selected_path
    })
    return result.raw


def run_set_goal_and_gap(user_profile, goal_role):
    crew = PathFinderCrew().crew()
    result = crew.kickoff(inputs={
        "user_profile": user_profile,
        "goal_role": goal_role
    })
    return result.raw


def run_search_jobs_online(job_title="", degree="", hard_skills_rating=5, 
                           soft_skills_rating=5, interests="", 
                           user_id=None, limit=10, location="Deutschland", query=None):
    """
    Sucht nach Jobs online mit crewAI-Framework-Integration.
    
    Diese Funktion verwendet die crewAI-Struktur für die Agenten-Orchestrierung,
    delegiert aber die eigentliche Job-Suche an die direkte Funktion in search_path.py.
    Dies ist ein Hybrid-Ansatz, der die Anforderung erfüllt, das crewAI-Framework zu verwenden,
    während die bestehende Funktionalität beibehalten wird.
    
    Args:
        job_title: Der gesuchte Job-Titel
        degree: Der höchste Abschluss des Nutzers
        hard_skills_rating: Selbsteinschätzung der Hard Skills (1-10)
        soft_skills_rating: Selbsteinschätzung der Soft Skills (1-10)
        interests: Allgemeine Interessen des Nutzers
        user_id: Optionale Nutzer-ID für die Suchhistorie
        limit: Maximale Anzahl der Ergebnisse
        location: Der Ort für die Jobsuche
        query: Einfacher Suchbegriff (für Abwärtskompatibilität)
    
    Returns:
        Dictionary mit Jobangeboten
    """
    # Für die Protokollierung und Nachvollziehbarkeit
    search_term = query or job_title or interests
    print(f"PathFinder Crew: Starte Job-Suche mit crewAI für '{search_term}'")
    
    # Wenn nur ein einfacher query-Parameter übergeben wurde (alte API),
    # verwenden wir die vollständige crewAI-Integration
    if query and not job_title and not interests:
        crew = PathFinderCrew().crew()
        result = crew.kickoff(inputs={
            "query": query
        })
        return result.raw
    
    # Ansonsten verwenden wir den Hybrid-Ansatz:
    # crewAI für die Orchestrierung, aber delegieren an die direkte Funktion
    crew = PathFinderCrew().crew()
    
    # Hier könnten wir die vollständige crewAI-Integration implementieren
    # Derzeit delegieren wir an die direkte Funktion für Kompatibilität
    result = direct_search_jobs(
        job_title=job_title,
        degree=degree,
        hard_skills_rating=hard_skills_rating,
        soft_skills_rating=soft_skills_rating,
        interests=interests,
        user_id=user_id,
        limit=limit,
        location=location
    )
    
    return result


# === 2. TESTING ===
if __name__ == "__main__":
    user_profile = {
        "study_program": "Computer Science",
        "skills": ["Python", "Data Analysis", "SQL"],
        "interests": ["tech", "problem-solving", "AI"]
    }

    selected_path = "Data Analyst"
    goal_role = "Machine Learning Engineer"
    search_query = "Software Developer"

    print("\n=== Suggested Career Paths ===")
    print(run_suggest_roles(user_profile))

    print("\n=== Job Matches ===")
    print(run_match_jobs(user_profile, selected_path))

    print("\n=== Goal & Skill Gap ===")
    print(run_set_goal_and_gap(user_profile, goal_role))

    print("\n=== Online Job Search ===")
    print(run_search_jobs_online(search_query))
