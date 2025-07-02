"""Add commentMore actions
Session management module for maintaining conversation context.
"""
from typing import Dict, List, Any, Optional
import time

# In-memory storage for session data
# In a production environment, consider using Redis or a database
sessions: Dict[str, Dict[str, Any]] = {}

# Session expiration time (in seconds)
SESSION_EXPIRY = 3600  # 1 hour


def get_session(session_id: str) -> Dict[str, Any]:
    """
    Retrieve a session by ID or create a new one if it doesn't exist.
    """
    # Clean up expired sessions periodically
    cleanup_expired_sessions()
    
    if session_id not in sessions:
        sessions[session_id] = {
            "created_at": time.time(),
            "last_accessed": time.time(),
            "conversation_history": [],
            "metadata": {}
        }
    else:
        # Update last accessed time
        sessions[session_id]["last_accessed"] = time.time()
        
    return sessions[session_id]


def get_conversation_history(session_id: str) -> List[Dict[str, str]]:
    """
    Get the conversation history for a specific session.
    """
    session = get_session(session_id)
    return session.get("conversation_history", [])


def save_conversation_history(session_id: str, history: List[Dict[str, str]]) -> None:
    """
    Save conversation history for a specific session.
    """
    session = get_session(session_id)
    session["conversation_history"] = history
    session["last_accessed"] = time.time()


def add_message_to_history(session_id: str, role: str, content: str) -> None:
    """
    Add a message to the conversation history.
    """
    history = get_conversation_history(session_id)
    history.append({"role": role, "content": content})
    save_conversation_history(session_id, history)


def set_session_metadata(session_id: str, key: str, value: Any) -> None:
    """
    Store metadata in the session.
    """
    session = get_session(session_id)
    if "metadata" not in session:
        session["metadata"] = {}
    session["metadata"][key] = value
    session["last_accessed"] = time.time()


def get_session_metadata(session_id: str, key: str = None, default: Any = None) -> Any:
    """
    Retrieve metadata from the session.
    If key is None, returns all metadata.
    """
    session = get_session(session_id)
    if key is None:
        return session.get("metadata", {})
    return session.get("metadata", {}).get(key, default)


def cleanup_expired_sessions() -> None:
    """
    Remove expired sessions to prevent memory leaks.
    """
    current_time = time.time()
    expired_sessions = [
        session_id for session_id, session in sessions.items()
        if current_time - session["last_accessed"] > SESSION_EXPIRY
    ]
    
    for session_id in expired_sessions:
        del sessions[session_id]