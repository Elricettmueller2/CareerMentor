#!/usr/bin/env python3
"""
Test script for ResumeRefiner agents.
This script tests each agent individually using a test PDF.
"""

import os
import sys
import json
import shutil
from pathlib import Path

# Add the parent directory to the path so we can import the agents
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

# Import the agents
from crews.resume_refiner.layout_agent import LayoutAgent
from crews.resume_refiner.parser_agent import ParserAgent
from crews.resume_refiner.quality_agent import QualityAgent
from crews.resume_refiner.match_agent import MatchAgent

# Test PDF path
TEST_PDF_PATH = Path(__file__).parent / "CV Maximilian Weicht English.pdf"
TEST_UPLOAD_ID = "test_cv"
TMP_DIR = "/tmp/resumes"

# Ensure the tmp directory exists
os.makedirs(TMP_DIR, exist_ok=True)

# Copy the test PDF to the tmp directory
tmp_pdf_path = os.path.join(TMP_DIR, f"{TEST_UPLOAD_ID}.pdf")
shutil.copy(TEST_PDF_PATH, tmp_pdf_path)
print(f"Copied test PDF to {tmp_pdf_path}")

def pretty_print(title, data):
    """Print data in a nice format"""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80)
    if isinstance(data, dict):
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(data)
    print("=" * 80 + "\n")

def test_layout_agent():
    """Test the LayoutAgent"""
    print("\nTesting LayoutAgent...")
    agent = LayoutAgent()
    try:
        result = agent.analyze_layout(TEST_UPLOAD_ID)
        pretty_print("LayoutAgent Result", result)
        return True
    except Exception as e:
        print(f"Error testing LayoutAgent: {e}")
        return False

def test_parser_agent():
    """Test the ParserAgent"""
    print("\nTesting ParserAgent...")
    agent = ParserAgent()
    try:
        result = agent.parse_with_sections(TEST_UPLOAD_ID)
        pretty_print("ParserAgent Result", result)
        return True
    except Exception as e:
        print(f"Error testing ParserAgent: {e}")
        return False

def test_quality_agent():
    """Test the QualityAgent"""
    print("\nTesting QualityAgent...")
    # First get parsed resume data
    parser = ParserAgent()
    layout_agent = LayoutAgent()
    
    try:
        resume_data = parser.parse_with_sections(TEST_UPLOAD_ID)
        layout_data = layout_agent.analyze_layout(TEST_UPLOAD_ID)
        
        agent = QualityAgent()
        result = agent.evaluate_resume(resume_data, layout_data)
        pretty_print("QualityAgent Result", result)
        return True
    except Exception as e:
        print(f"Error testing QualityAgent: {e}")
        return False

def test_match_agent():
    """Test the MatchAgent"""
    print("\nTesting MatchAgent...")
    # First get parsed resume data
    parser = ParserAgent()
    
    # Sample job description
    job_descriptions = [{
        "id": "job1",
        "title": "Software Engineer",
        "description": """
        We are looking for a Software Engineer with experience in Python, 
        machine learning, and AI. The ideal candidate will have experience 
        with FastAPI, Docker, and cloud services. Knowledge of NLP and 
        LLMs is a plus.
        """
    }]
    
    try:
        resume_data = parser.parse_with_sections(TEST_UPLOAD_ID)
        
        agent = MatchAgent()
        result = agent.match_jobs(resume_data, job_descriptions)
        pretty_print("MatchAgent Result", result)
        return True
    except Exception as e:
        print(f"Error testing MatchAgent: {e}")
        return False

if __name__ == "__main__":
    print("Starting agent tests...")
    
    # Test each agent
    layout_success = test_layout_agent()
    parser_success = test_parser_agent()
    quality_success = test_quality_agent()
    match_success = test_match_agent()
    
    # Print summary
    print("\n" + "=" * 80)
    print(" TEST RESULTS ".center(80, "="))
    print("=" * 80)
    print(f"LayoutAgent:  {'✅ PASS' if layout_success else '❌ FAIL'}")
    print(f"ParserAgent:  {'✅ PASS' if parser_success else '❌ FAIL'}")
    print(f"QualityAgent: {'✅ PASS' if quality_success else '❌ FAIL'}")
    print(f"MatchAgent:   {'✅ PASS' if match_success else '❌ FAIL'}")
    print("=" * 80)
