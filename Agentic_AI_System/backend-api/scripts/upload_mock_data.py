#!/usr/bin/env python
"""
MongoDB Mock Data Upload Script für CareerMentor

Dieses Skript lädt Beispieldaten in die MongoDB-Datenbank, um die Systeme zu testen,
ohne von der aktuellen TrackPal-Implementierung abhängig zu sein.
"""

import os
import sys
import json
from datetime import datetime, timedelta
import uuid
from dotenv import load_dotenv
from pprint import pprint

# Add the parent directory to the path so we can import the services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.mongodb.client import mongo_client

# Beispiel-Jobs
MOCK_JOBS = [
    {
        "job_id": "JOB-12345",
        "title": "Senior Software Engineer",
        "company": "TechCorp GmbH",
        "location": "Berlin, Deutschland",
        "description": "Wir suchen einen erfahrenen Software Engineer mit Kenntnissen in Python und React.",
        "requirements": ["Python", "React", "MongoDB", "5+ Jahre Erfahrung"],
        "salary_range": "70.000€ - 90.000€",
        "job_type": "Vollzeit",
        "remote": True,
        "url": "https://example.com/jobs/12345",
        "posted_date": datetime.now() - timedelta(days=3)
    },
    {
        "job_id": "JOB-23456",
        "title": "Frontend Developer",
        "company": "WebDesign AG",
        "location": "München, Deutschland",
        "description": "Frontend-Entwickler für moderne Webanwendungen gesucht.",
        "requirements": ["JavaScript", "React", "CSS", "3+ Jahre Erfahrung"],
        "salary_range": "55.000€ - 70.000€",
        "job_type": "Vollzeit",
        "remote": False,
        "url": "https://example.com/jobs/23456",
        "posted_date": datetime.now() - timedelta(days=5)
    },
    {
        "job_id": "JOB-34567",
        "title": "DevOps Engineer",
        "company": "CloudSystems GmbH",
        "location": "Hamburg, Deutschland",
        "description": "DevOps-Ingenieur für die Verwaltung unserer Cloud-Infrastruktur.",
        "requirements": ["AWS", "Docker", "Kubernetes", "CI/CD", "2+ Jahre Erfahrung"],
        "salary_range": "65.000€ - 85.000€",
        "job_type": "Vollzeit",
        "remote": True,
        "url": "https://example.com/jobs/34567",
        "posted_date": datetime.now() - timedelta(days=1)
    }
]

# Beispiel-Bewerbungen
def generate_mock_applications(user_id):
    return [
        {
            "user_id": user_id,
            "job_id": "JOB-12345",
            "status": "applied",
            "applied_date": datetime.now() - timedelta(days=2),
            "notes": "Bewerbung per E-Mail gesendet",
            "next_steps": "Auf Rückmeldung warten",
            "reminder_date": datetime.now() + timedelta(days=5)
        },
        {
            "user_id": user_id,
            "job_id": "JOB-23456",
            "status": "interview_scheduled",
            "applied_date": datetime.now() - timedelta(days=4),
            "interview_date": datetime.now() + timedelta(days=2),
            "notes": "Telefoninterview mit HR",
            "next_steps": "Interview vorbereiten",
            "reminder_date": datetime.now() + timedelta(days=1)
        }
    ]

# Beispiel-Uploads (Lebenslauf)
MOCK_UPLOADS = [
    {
        "upload_id": "RESUME-12345",
        "user_id": "default_user",
        "file_name": "lebenslauf.pdf",
        "file_type": "application/pdf",
        "upload_date": datetime.now() - timedelta(days=7),
        "parsed_data": {
            "name": "Max Mustermann",
            "email": "max@example.com",
            "phone": "+49 123 456789",
            "skills": ["Python", "JavaScript", "React", "MongoDB"],
            "experience": [
                {
                    "title": "Software Developer",
                    "company": "Tech GmbH",
                    "duration": "2020-2023",
                    "description": "Entwicklung von Webanwendungen"
                }
            ],
            "education": [
                {
                    "degree": "M.Sc. Informatik",
                    "institution": "TU Berlin",
                    "year": "2020"
                }
            ]
        }
    }
]

# Beispiel-Interview
MOCK_INTERVIEWS = [
    {
        "interview_id": "INTERVIEW-12345",
        "user_id": "default_user",
        "job_id": "JOB-23456",
        "date": datetime.now() - timedelta(days=1),
        "questions": [
            {
                "question": "Erzählen Sie etwas über Ihre Erfahrung mit React.",
                "answer": "Ich habe 3 Jahre Erfahrung mit React und habe mehrere Projekte umgesetzt.",
                "feedback": "Gute Antwort, aber mehr Details zu konkreten Projekten wären hilfreich."
            },
            {
                "question": "Wie würden Sie ein Performance-Problem in einer React-Anwendung debuggen?",
                "answer": "Ich würde React DevTools verwenden, um Rendering-Probleme zu identifizieren.",
                "feedback": "Solide Antwort, erwähnt wichtige Tools."
            }
        ],
        "overall_feedback": "Gute technische Kenntnisse, könnte mehr Beispiele aus der Praxis einbringen.",
        "score": 8
    }
]

def upload_mock_data():
    """Lädt Beispieldaten in die MongoDB-Datenbank"""
    print("\n=== Lade Beispieldaten in MongoDB ===")
    
    # Benutzer-ID
    user_id = "default_user"
    
    # Jobs hochladen
    print("\n--- Lade Jobs ---")
    for job in MOCK_JOBS:
        # Prüfen, ob der Job bereits existiert
        existing_job = mongo_client.db.jobs.find_one({"job_id": job["job_id"]})
        if existing_job:
            print(f"Job {job['job_id']} existiert bereits, wird übersprungen.")
            continue
        
        # Job einfügen
        result = mongo_client.db.jobs.insert_one(job)
        print(f"Job {job['job_id']} ({job['title']}) hinzugefügt: {result.inserted_id}")
    
    # Bewerbungen hochladen
    print("\n--- Lade Bewerbungen ---")
    applications = generate_mock_applications(user_id)
    for app in applications:
        # Prüfen, ob die Bewerbung bereits existiert
        existing_app = mongo_client.db.applications.find_one({
            "user_id": app["user_id"], 
            "job_id": app["job_id"]
        })
        if existing_app:
            print(f"Bewerbung für {app['job_id']} existiert bereits, wird aktualisiert.")
            result = mongo_client.db.applications.update_one(
                {"user_id": app["user_id"], "job_id": app["job_id"]},
                {"$set": app}
            )
            print(f"Bewerbung aktualisiert: {result.modified_count} Dokument(e)")
        else:
            result = mongo_client.db.applications.insert_one(app)
            print(f"Bewerbung für {app['job_id']} hinzugefügt: {result.inserted_id}")
    
    # Uploads hochladen
    print("\n--- Lade Uploads ---")
    for upload in MOCK_UPLOADS:
        # Prüfen, ob der Upload bereits existiert
        existing_upload = mongo_client.db.uploads.find_one({"upload_id": upload["upload_id"]})
        if existing_upload:
            print(f"Upload {upload['upload_id']} existiert bereits, wird übersprungen.")
            continue
        
        # Upload einfügen
        result = mongo_client.db.uploads.insert_one(upload)
        print(f"Upload {upload['upload_id']} hinzugefügt: {result.inserted_id}")
    
    # Interviews hochladen
    print("\n--- Lade Interviews ---")
    for interview in MOCK_INTERVIEWS:
        # Prüfen, ob das Interview bereits existiert
        existing_interview = mongo_client.db.interviews.find_one({"interview_id": interview["interview_id"]})
        if existing_interview:
            print(f"Interview {interview['interview_id']} existiert bereits, wird übersprungen.")
            continue
        
        # Interview einfügen
        result = mongo_client.db.interviews.insert_one(interview)
        print(f"Interview {interview['interview_id']} hinzugefügt: {result.inserted_id}")
    
    # Global State aktualisieren
    print("\n--- Aktualisiere Global State ---")
    # Hole den aktuellen Global State
    global_state = mongo_client.db.global_state.find_one({"user.id": user_id})
    
    if global_state:
        # Aktualisiere job_search.saved_jobs mit den IDs der hochgeladenen Jobs
        saved_jobs = [job["job_id"] for job in MOCK_JOBS[:2]]  # Speichere nur die ersten beiden Jobs
        
        # Aktualisiere search_history
        search_history = ["Software Engineer", "Frontend Developer", "DevOps"]
        
        # Aktualisiere den Global State
        result = mongo_client.db.global_state.update_one(
            {"user.id": user_id},
            {"$set": {
                "agent_knowledge.job_search.saved_jobs": saved_jobs,
                "agent_knowledge.job_search.search_history": search_history,
                "agent_knowledge.job_search.recent_searches": search_history,
                "agent_knowledge.resume.current_resume_id": MOCK_UPLOADS[0]["upload_id"],
                "last_updated": datetime.now().timestamp()
            }}
        )
        print(f"Global State aktualisiert: {result.modified_count} Dokument(e)")
    else:
        print(f"Global State für Benutzer {user_id} nicht gefunden.")
    
    print("\n=== Beispieldaten erfolgreich hochgeladen ===")
    
    # Zusammenfassung anzeigen
    print("\nDatenbank-Zusammenfassung:")
    for collection in mongo_client.db.list_collection_names():
        count = mongo_client.db[collection].count_documents({})
        print(f"- {collection}: {count} Dokumente")

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Upload mock data
    upload_mock_data()
