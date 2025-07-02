#!/usr/bin/env python
"""
MongoDB Initialization Script for CareerMentor

This script initializes the MongoDB database with the necessary collections
and default data structure for the CareerMentor application.
"""

import os
import time
from dotenv import load_dotenv
import sys

# Add the parent directory to the path so we can import the services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.mongodb.client import mongo_client
from services.mongodb.global_state_service import DEFAULT_STATE, global_state

def init_mongodb():
    """Initialize MongoDB with necessary collections and default data"""
    print("Initializing MongoDB database...")
    
    # Get database name
    db_name = mongo_client.db.name
    print(f"Using database: {db_name}")
    
    # Create collections if they don't exist
    collections = [
        "global_state",  # For storing user state
        "uploads",       # For storing resume uploads
        "jobs",          # For storing job listings
        "applications",  # For storing job applications
        "interviews"     # For storing interview sessions
    ]
    
    existing_collections = mongo_client.db.list_collection_names()
    
    for collection in collections:
        if collection not in existing_collections:
            mongo_client.db.create_collection(collection)
            print(f"Created collection: {collection}")
        else:
            print(f"Collection already exists: {collection}")
    
    # Initialize default user state if it doesn't exist
    default_user_id = "default_user"
    default_state = global_state.get_state(default_user_id)
    
    if default_state == DEFAULT_STATE:
        print(f"Default state for user '{default_user_id}' already initialized")
    else:
        print(f"Initialized default state for user '{default_user_id}'")
    
    # Create indexes for better query performance
    print("Creating indexes...")
    mongo_client.db.global_state.create_index("user.id", unique=True)
    mongo_client.db.uploads.create_index("user_id")
    mongo_client.db.jobs.create_index("job_id", unique=True)
    mongo_client.db.applications.create_index([("user_id", 1), ("job_id", 1)], unique=True)
    
    print("MongoDB initialization complete.")
    
    # Print summary
    print("\nDatabase Summary:")
    for collection in mongo_client.db.list_collection_names():
        count = mongo_client.db[collection].count_documents({})
        print(f"- {collection}: {count} documents")

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Initialize MongoDB
    init_mongodb()
