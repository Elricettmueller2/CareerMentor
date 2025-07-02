"""
MongoDB Sync Service for CareerMentor

This service provides endpoints for syncing the global state between the frontend and backend.
"""

from typing import Any, Dict, Optional
from .global_state_service import global_state
import json
from datetime import datetime


class SyncService:
    """
    Service for syncing global state between frontend and backend
    """
    
    @staticmethod
    def sync_from_frontend(frontend_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sync the backend state with the frontend state
        
        Args:
            frontend_state: The state from the frontend
            
        Returns:
            Dict with the result of the sync operation
        """
        try:
            # Get user ID from frontend state
            user_id = frontend_state.get("user", {}).get("id", "default_user")
            
            # Get the current backend state
            backend_state = global_state.get_state(user_id)
            
            # Convert frontend camelCase to backend snake_case
            converted_state = SyncService._convert_to_snake_case(frontend_state)
            
            # Check if the frontend state is newer than the backend state
            frontend_last_updated = converted_state.get("last_updated")
            backend_last_updated = backend_state.get("last_updated")
            
            # If frontend state is newer or no backend timestamp, update backend
            if not backend_last_updated or (frontend_last_updated and frontend_last_updated > backend_last_updated):
                # Update user data
                if "user" in converted_state:
                    if "id" in converted_state["user"]:
                        global_state.set_user_id(converted_state["user"]["id"])
                    
                    if "preferences" in converted_state["user"]:
                        backend_state["user"]["preferences"] = converted_state["user"]["preferences"]
                
                # Update agent knowledge
                if "agent_knowledge" in converted_state:
                    agent_knowledge = converted_state["agent_knowledge"]
                    
                    # Update user profile
                    if "user_profile" in agent_knowledge:
                        global_state.update_user_profile(lambda _: agent_knowledge["user_profile"], user_id)
                    
                    # Update interview data
                    if "interview" in agent_knowledge:
                        interview_data = agent_knowledge["interview"]
                        global_state.update_interview_data(lambda _: interview_data, user_id)
                    
                    # Update resume data
                    if "resume" in agent_knowledge:
                        resume_data = agent_knowledge["resume"]
                        backend_state["agent_knowledge"]["resume"] = resume_data
                    
                    # Update job search data
                    if "job_search" in agent_knowledge:
                        job_search_data = agent_knowledge["job_search"]
                        global_state.update_job_search_data(lambda _: job_search_data, user_id)
                    
                    # Update applications
                    if "applications" in agent_knowledge:
                        applications = agent_knowledge["applications"]
                        backend_state["agent_knowledge"]["applications"] = applications
            
                # Save the updated state
                global_state.set_state(backend_state, user_id)
            
            # Return the updated backend state (converted to camelCase)
            return {
                "success": True,
                "message": "Sync successful",
                "state": SyncService._convert_to_camel_case(global_state.get_state(user_id))
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Sync failed: {str(e)}"
            }
    
    @staticmethod
    def get_backend_state(user_id: str = "default_user") -> Dict[str, Any]:
        """
        Get the current backend state
        
        Returns:
            Dict with the result of the get operation
        """
        try:
            state = global_state.get_state(user_id)
            return {
                "success": True,
                "state": SyncService._convert_to_camel_case(state)
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to get state: {str(e)}"
            }
    
    @staticmethod
    def update_knowledge(key: str, value: Any, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Update a specific knowledge item in the global state
        
        Args:
            key: The key of the knowledge item to update
            value: The new value
            user_id: The user ID
            
        Returns:
            Dict with the result of the update operation
        """
        try:
            # Get current state
            state = global_state.get_state(user_id)
            
            # Update the knowledge item
            parts = key.split('.')
            current = state
            
            # Navigate to the nested object
            for i, part in enumerate(parts[:-1]):
                if part not in current:
                    current[part] = {}
                current = current[part]
            
            # Set the value
            current[parts[-1]] = value
            
            # Save the updated state
            global_state.set_state(state, user_id)
            
            return {
                "success": True,
                "message": f"Knowledge item {key} updated successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to update knowledge item: {str(e)}"
            }
    
    @staticmethod
    def _convert_to_snake_case(obj: Any) -> Any:
        """
        Convert camelCase keys to snake_case
        
        Args:
            obj: The object to convert
            
        Returns:
            The converted object
        """
        if isinstance(obj, dict):
            new_dict = {}
            for key, value in obj.items():
                # Convert key from camelCase to snake_case
                snake_key = ''.join(['_' + c.lower() if c.isupper() else c for c in key]).lstrip('_')
                new_dict[snake_key] = SyncService._convert_to_snake_case(value)
            return new_dict
        elif isinstance(obj, list):
            return [SyncService._convert_to_snake_case(item) for item in obj]
        else:
            return obj
    
    @staticmethod
    def _convert_to_camel_case(obj: Any) -> Any:
        """
        Convert snake_case keys to camelCase
        
        Args:
            obj: The object to convert
            
        Returns:
            The converted object
        """
        if isinstance(obj, dict):
            new_dict = {}
            for key, value in obj.items():
                # Convert key from snake_case to camelCase
                components = key.split('_')
                camel_key = components[0] + ''.join(x.title() for x in components[1:])
                new_dict[camel_key] = SyncService._convert_to_camel_case(value)
            return new_dict
        elif isinstance(obj, list):
            return [SyncService._convert_to_camel_case(item) for item in obj]
        else:
            return obj

# Create a singleton instance
sync_service = SyncService()
