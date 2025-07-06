"""
MongoDB-backed Global State Service for CareerMentor

This service provides a singleton instance for managing global state
using MongoDB as the backend database.
"""

import os
import json
import time
from typing import Dict, Any, Optional, List
import uuid

from .client import MongoDBClient

# Default state 
DEFAULT_STATE = {
    "user": {
        "id": "default_user",
        "preferences": {}
    },
    "agent_knowledge": {
        "user_profile": {
            "skills": [],
            "experience": [],
            "education": [],
            "job_preferences": {
                "roles": [],
                "locations": [],
                "industries": []
            }
        },
        "interview": {
            "current_session_id": None,
            "history": {}
        },
        "resume": {
            "current_resume_id": None,
            "resumes": {}
        },
        "job_search": {
            "saved_jobs": [
                # Beispiel für die Struktur eines gespeicherten Jobs
                # {
                #     "id": "",                  # Job-ID von der Quelle (z.B. Adzuna)
                #     "position": "",            # Jobtitel/Position
                #     "company": "",             # Firmenname
                #     "location": "",            # Standort
                #     "application_link": "",    # Link zur Bewerbung
                #     "description": "",         # Jobbeschreibung
                #     "match_score": 0,          # Übereinstimmungswert (0-100)
                #     "distance": 0,             # Entfernung (falls verfügbar)
                #     "education_required": "",  # Erforderliche Ausbildung
                #     "experience_required": 0,  # Erforderliche Erfahrung in Jahren
                #     "salary": "",              # Gehaltsangabe (falls verfügbar)
                #     "skills": [],              # Liste der erforderlichen Fähigkeiten
                #     "requirements": "",        # Weitere Anforderungen
                #     "source": "",              # Quelle des Jobs (z.B. "Adzuna")
                #     "status": "",              # Bewerbungsstatus (falls verfolgt)
                #     "days_since_applied": "",  # Tage seit Bewerbung (falls verfolgt)
                #     "days_until_followup": "", # Tage bis zum Follow-up (falls verfolgt)
                #     "notes": "",               # Notizen zum Job
                #     "created_at": "",          # Erstellungsdatum
                #     "updated_at": ""           # Aktualisierungsdatum
                # }
            ],
            "search_history": [],
            "recent_searches": []
        },
        "applications": {}
    },
    "system": {
        "is_online": True,
        "last_sync_time": None
    },
    "last_updated": None
}


class GlobalStateService:
    """
    MongoDB-backed Global State Service
    
    This service provides methods to get and set the global state
    using MongoDB as the backend database.
    """
    
    _instance = None
    
    def __new__(cls):
        """Singleton pattern to ensure only one instance exists"""
        if cls._instance is None:
            cls._instance = super(GlobalStateService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize the MongoDB connection and collections"""
        self.mongo_client = MongoDBClient()
        self.global_state_collection = self.mongo_client.get_collection("global_state")
        
    def get_state(self, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Get the global state for a user
        
        Args:
            user_id: The user ID to get state for
            
        Returns:
            The global state as a dictionary
        """
        # Find the state document for the user
        state_doc = self.global_state_collection.find_one({"user.id": user_id})
        
        # If no state exists, create default state
        if not state_doc:
            default_state = self._create_default_state(user_id)
            return default_state
        
        # Remove MongoDB _id field
        if "_id" in state_doc:
            del state_doc["_id"]
            
        return state_doc
    
    def set_state(self, state: Dict[str, Any], user_id: str = "default_user") -> None:
        """
        Set the global state for a user
        
        Args:
            state: The state to set
            user_id: The user ID to set state for
        """
        # Add timestamp
        state["last_updated"] = time.time()
        
        # Ensure user ID is set correctly
        if "user" not in state:
            state["user"] = {"id": user_id}
        else:
            state["user"]["id"] = user_id
            
        # Upsert the state document
        self.global_state_collection.update_one(
            {"user.id": user_id},
            {"$set": state},
            upsert=True
        )
    
    def _create_default_state(self, user_id: str) -> Dict[str, Any]:
        """
        Create default state for a new user
        
        Args:
            user_id: The user ID to create state for
            
        Returns:
            The default state
        """
        default_state = DEFAULT_STATE.copy()
        default_state["user"]["id"] = user_id
        default_state["last_updated"] = time.time()
        
        # Save to MongoDB
        self.global_state_collection.insert_one(default_state)
        
        return default_state
    
    def get_user_profile(self, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Get the user profile from the global state
        
        Args:
            user_id: The user ID to get profile for
            
        Returns:
            The user profile
        """
        state = self.get_state(user_id)
        return state.get("agent_knowledge", {}).get("user_profile", {})
    
    def update_user_profile(self, profile_data: Dict[str, Any], user_id: str = "default_user") -> None:
        """
        Update the user profile in the global state
        
        Args:
            profile_data: The profile data to update
            user_id: The user ID to update profile for
        """
        self.global_state_collection.update_one(
            {"user.id": user_id},
            {"$set": {"agent_knowledge.user_profile": profile_data}},
            upsert=True
        )
    
    def get_job_search_data(self, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Get the job search data from the global state
        
        Args:
            user_id: The user ID to get data for
            
        Returns:
            The job search data
        """
        state = self.get_state(user_id)
        return state.get("agent_knowledge", {}).get("job_search", {})
    
    def update_job_search_data(self, job_search_data: Dict[str, Any], user_id: str = "default_user") -> None:
        """
        Update the job search data in the global state
        
        Args:
            job_search_data: The job search data to update
            user_id: The user ID to update data for
        """
        self.global_state_collection.update_one(
            {"user.id": user_id},
            {"$set": {"agent_knowledge.job_search": job_search_data}},
            upsert=True
        )
    
    def get_interview_data(self, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Get the interview data from the global state
        
        Args:
            user_id: The user ID to get data for
            
        Returns:
            The interview data
        """
        state = self.get_state(user_id)
        return state.get("agent_knowledge", {}).get("interview", {})
    
    def update_interview_data(self, interview_data: Dict[str, Any], user_id: str = "default_user") -> None:
        """
        Update the interview data in the global state
        
        Args:
            interview_data: The interview data to update
            user_id: The user ID to update data for
        """
        self.global_state_collection.update_one(
            {"user.id": user_id},
            {"$set": {"agent_knowledge.interview": interview_data}},
            upsert=True
        )
    
    def update_interview_session(self, user_id: str, session_id: str, session_data: Dict[str, Any]) -> None:
        """
        Update a specific interview session in the global state
        
        Args:
            user_id: The user ID to update session for
            session_id: The session ID to update
            session_data: The session data to update
        """
        self.global_state_collection.update_one(
            {"user.id": user_id},
            {"$set": {f"agent_knowledge.interview.history.{session_id}": session_data}},
            upsert=True
        )
    
    def add_mock_resume(self, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Add a mock parsed resume to the database for testing PathFinder
        
        Args:
            user_id: The user ID to add the resume for
            
        Returns:
            The added resume data
        """
        resume_id = str(uuid.uuid4())
        
        # Create a mock parsed resume similar to what ParserAgent would produce
        mock_resume = {
            "full_text": """
            Max Mustermann
            Software Developer
            
            Profile
            Experienced software developer with 3 years of experience in web development and machine learning.
            Passionate about creating user-friendly applications and implementing AI solutions.
            
            Experience
            Software Developer, TechCorp GmbH
            January 2020 - Present
            - Developed and maintained web applications using React and Node.js
            - Implemented machine learning models for data analysis
            - Collaborated with cross-functional teams to deliver high-quality software
            - Improved application performance by 30%
            
            Junior Developer, StartUp Solutions
            June 2018 - December 2019
            - Assisted in front-end development using HTML, CSS, and JavaScript
            - Participated in code reviews and testing
            - Developed small features for the company's main product
            
            Education
            Bachelor of Science in Computer Science
            Technical University of Munich
            2015 - 2019
            
            Skills
            Programming Languages: Python, JavaScript, Java, C++
            Frameworks & Libraries: React, Node.js, Express, TensorFlow, PyTorch
            Database: MongoDB, PostgreSQL, MySQL
            Tools: Git, Docker, AWS, Azure
            Languages: German (Native), English (Fluent)
            """,
            "sections": {
                "profile": "Experienced software developer with 3 years of experience in web development and machine learning. Passionate about creating user-friendly applications and implementing AI solutions.",
                "experience": """Software Developer, TechCorp GmbH
                January 2020 - Present
                - Developed and maintained web applications using React and Node.js
                - Implemented machine learning models for data analysis
                - Collaborated with cross-functional teams to deliver high-quality software
                - Improved application performance by 30%
                
                Junior Developer, StartUp Solutions
                June 2018 - December 2019
                - Assisted in front-end development using HTML, CSS, and JavaScript
                - Participated in code reviews and testing
                - Developed small features for the company's main product""",
                "education": """Bachelor of Science in Computer Science
                Technical University of Munich
                2015 - 2019""",
                "skills": """Programming Languages: Python, JavaScript, Java, C++
                Frameworks & Libraries: React, Node.js, Express, TensorFlow, PyTorch
                Database: MongoDB, PostgreSQL, MySQL
                Tools: Git, Docker, AWS, Azure
                Languages: German (Native), English (Fluent)"""
            },
            "keywords": [
                "python", "javascript", "react", "node", "machine", "learning", 
                "developer", "software", "web", "applications", "tensorflow"
            ]
        }
        
        # Update the global state with the mock resume
        self.global_state_collection.update_one(
            {"user.id": user_id},
            {
                "$set": {
                    "agent_knowledge.resume.current_resume_id": resume_id,
                    f"agent_knowledge.resume.resumes.{resume_id}": mock_resume
                }
            },
            upsert=True
        )
        
        # Also update the user profile with information from the resume
        user_profile = {
            "skills": ["Python", "JavaScript", "React", "Node.js", "Machine Learning", "TensorFlow"],
            "experience": [
                {
                    "title": "Software Developer",
                    "company": "TechCorp GmbH",
                    "duration": "3 years",
                    "description": "Web development and machine learning"
                },
                {
                    "title": "Junior Developer",
                    "company": "StartUp Solutions",
                    "duration": "1.5 years",
                    "description": "Front-end development"
                }
            ],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "institution": "Technical University of Munich",
                    "year": "2019"
                }
            ],
            "job_preferences": {
                "roles": ["Software Developer", "Machine Learning Engineer", "Full Stack Developer"],
                "locations": ["Munich", "Berlin", "Remote"],
                "industries": ["Technology", "AI", "Web Development"]
            }
        }
        
        self.update_user_profile(user_profile, user_id)
        
        return mock_resume


# Create a singleton instance
global_state = GlobalStateService()
