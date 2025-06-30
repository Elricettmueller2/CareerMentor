"""
MongoDB client for CareerMentor backend
"""

import os
from pymongo import MongoClient
from typing import Optional

class MongoDBClient:
    """
    Singleton MongoDB client for CareerMentor
    """
    _instance: Optional['MongoDBClient'] = None
    
    @classmethod
    def get_instance(cls):
        """Get the singleton instance"""
        if cls._instance is None:
            cls._instance = MongoDBClient()
        return cls._instance
    
    def __init__(self):
        """Initialize the MongoDB client"""
        # Get MongoDB URI from environment variable or use default
        # In Docker, we need to use the container name or IP
        # For local development, we use localhost
        # For Docker, we can use host.docker.internal to access the host
        mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        
        # Try to connect with a timeout to avoid hanging if MongoDB is not available
        try:
            self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            # Force a connection to verify it works
            self.client.server_info()
            print("Successfully connected to MongoDB")
        except Exception as e:
            print(f"Failed to connect to MongoDB at {mongo_uri}: {e}")
            print("Trying alternative connection methods...")
            
            # Try alternative connection methods for Docker
            alternative_uris = [
                "mongodb://host.docker.internal:27017",  # For Docker on Mac/Windows
                "mongodb://172.17.0.1:27017",         # Common Docker bridge network
                "mongodb://mongodb:27017",            # If using container name
                "mongodb://career-mentor-mongodb:27017"  # Using consistent naming with your containers
            ]
            
            for uri in alternative_uris:
                try:
                    print(f"Trying {uri}...")
                    self.client = MongoClient(uri, serverSelectionTimeoutMS=3000)
                    self.client.server_info()
                    print(f"Successfully connected to MongoDB at {uri}")
                    break
                except Exception as e:
                    print(f"Failed to connect to {uri}: {e}")
            else:
                # If all alternatives fail, use the original URI but don't verify connection
                print("All connection attempts failed. Using original URI without verification.")
                self.client = MongoClient(mongo_uri)
        
        self.db = self.client[os.getenv("MONGO_DB_NAME", "careermentor")]
        
    def get_collection(self, collection_name):
        """Get a collection from the database"""
        return self.db[collection_name]

# Create a singleton instance
mongo_client = MongoDBClient.get_instance()
