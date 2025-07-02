#!/usr/bin/env python3
"""
Script to add a mock resume to the MongoDB database for testing PathFinder
"""

import sys
import os
import logging

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.mongodb.global_state_service import global_state

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Add a mock resume to the database"""
    try:
        logger.info("Adding mock resume to database...")
        
        # Add mock resume for default user
        mock_resume = global_state.add_mock_resume()
        
        logger.info(f"Mock resume added successfully with {len(mock_resume['keywords'])} keywords")
        logger.info(f"Resume sections: {', '.join(mock_resume['sections'].keys())}")
        
        # Verify the resume was added by retrieving it
        state = global_state.get_state()
        resume_id = state.get("agent_knowledge", {}).get("resume", {}).get("current_resume_id")
        
        if resume_id:
            logger.info(f"Resume ID in database: {resume_id}")
            logger.info("Mock resume added successfully to the database!")
        else:
            logger.error("Failed to verify resume in database")
            
    except Exception as e:
        logger.error(f"Error adding mock resume: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
