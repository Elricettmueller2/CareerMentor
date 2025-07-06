#!/usr/bin/env python3
"""
Test-Skript zum Überprüfen der MongoDB-Speicherfunktionalität für PathFinder-Jobs.

Dieses Skript:
1. Erstellt einen Beispiel-Job
2. Speichert den Job für einen Testbenutzer
3. Ruft die gespeicherten Jobs ab, um zu überprüfen, ob sie korrekt gespeichert wurden
"""

import sys
import os
import json
from pprint import pprint

# Path-Setup für den Import von Funktionen aus dem Backend-API
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Import der benötigten Funktionen
from crews.path_finder.search_path import save_job, get_saved_jobs
from services.mongodb.mongodb_pathfinder_utils import (
    save_job_for_user,
    get_saved_jobs_for_user,
    is_job_saved
)
from services.mongodb.global_state_service import global_state

# Testbenutzer-ID
TEST_USER_ID = "test_user"

def test_save_job():
    """Testet die Speicherung eines Jobs und das Abrufen gespeicherter Jobs."""
    
    # 1. Erstellen eines Beispiel-Jobs
    test_job = {
        "id": "test-job-123",
        "title": "Software Developer",
        "company_name": "Test Company",
        "location": "Berlin, Deutschland",
        "description": "This is a test job description for testing MongoDB storage.",
        "application_link": "https://example.com/apply",
        "requirements": "Python, JavaScript, MongoDB",
        "match_score": 85,
        "source": "Test Script"
    }
    
    print("\n1. Erstelle Beispiel-Job:")
    pprint(test_job)
    
    # 2. Job speichern mit der search_path.save_job-Funktion
    print("\n2. Speichere Job mit search_path.save_job()...")
    result = save_job(TEST_USER_ID, test_job)
    print(f"Ergebnis: {result}")
    
    # 3. Überprüfen, ob der Job gespeichert wurde
    print("\n3. Überprüfe, ob Job gespeichert wurde...")
    is_saved = is_job_saved(TEST_USER_ID, test_job["id"])
    print(f"Job ist gespeichert: {is_saved}")
    
    # 4. Gespeicherte Jobs über search_path.get_saved_jobs abrufen
    print("\n4. Rufe gespeicherte Jobs über search_path.get_saved_jobs() ab...")
    saved_jobs_result = get_saved_jobs(TEST_USER_ID)
    print(f"Anzahl gespeicherter Jobs: {saved_jobs_result.get('count', 0)}")
    
    # 5. Gespeicherte Jobs direkt über mongodb_pathfinder_utils abrufen
    print("\n5. Rufe gespeicherte Jobs direkt über mongodb_pathfinder_utils.get_saved_jobs_for_user() ab...")
    direct_saved_jobs = get_saved_jobs_for_user(TEST_USER_ID)
    print(f"Anzahl gespeicherter Jobs (direkt): {len(direct_saved_jobs)}")
    
    # 6. Überprüfen, ob der gespeicherte Job alle erwarteten Felder enthält
    if direct_saved_jobs:
        print("\n6. Überprüfe gespeicherten Job:")
        saved_job = next((job for job in direct_saved_jobs if job.get("id") == test_job["id"]), None)
        if saved_job:
            print("Gespeicherter Job gefunden:")
            pprint(saved_job)
        else:
            print("FEHLER: Gespeicherter Job nicht gefunden!")
    else:
        print("\n6. Keine Jobs gespeichert!")
    
    # 7. Überprüfen des global_state direkt
    print("\n7. Überprüfe global_state direkt...")
    state = global_state.get_state(TEST_USER_ID)
    job_search_data = state.get("agent_knowledge", {}).get("job_search", {})
    saved_jobs_in_state = job_search_data.get("saved_jobs", [])
    print(f"Anzahl Jobs im global_state: {len(saved_jobs_in_state)}")
    
    return result.get("success", False)

if __name__ == "__main__":
    print("=== Test der PathFinder Job-Speicherung in MongoDB ===")
    success = test_save_job()
    print("\nTest abgeschlossen.")
    print(f"Ergebnis: {'ERFOLGREICH' if success else 'FEHLGESCHLAGEN'}")
