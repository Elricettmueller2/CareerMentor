#!/usr/bin/env python3
"""
Test script for ResumeRefiner agents.
This script tests each agent individually using test files (PDF, JPG, PNG, HEIC).
"""

import os
import sys
import json
import shutil
import logging
from pathlib import Path
from datetime import datetime

# Konfiguriere das Logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, f"test_agents_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

# Konfiguriere Logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()  # Ausgabe auch auf der Konsole
    ]
)
logger = logging.getLogger("resume_refiner_tests")

logger.info(f"Logging to file: {log_file}")

# Add the parent directory to the path so we can import the agents
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

# Import the agents
from crews.resume_refiner.layout_agent import LayoutAgent
from crews.resume_refiner.parser_agent import ParserAgent
from crews.resume_refiner.quality_agent import QualityAgent
from crews.resume_refiner.match_agent import MatchAgent

# Test file paths
TEST_PDF_PATH = Path(__file__).parent / "CV Maximilian Weicht English.pdf"
TEST_IMAGE_PATH = Path(__file__).parent / "Resume-Maximilian-Weicht.jpg"  # Updated image file
TEST_PNG_PATH = Path(__file__).parent / "Resume-Maximilian-Weicht.png"    # Added PNG file
TEST_HEIC_PATH = Path(__file__).parent / "Resume-Maximilian-Weicht.heic"  # Updated HEIC file
TEST_PDF_ID = "test_cv_pdf"
TEST_IMAGE_ID = "test_cv_image"
TEST_PNG_ID = "test_cv_png"
TEST_HEIC_ID = "test_cv_heic"
TMP_DIR = "/tmp/resumes"

# Ensure the tmp directory exists
os.makedirs(TMP_DIR, exist_ok=True)

# Copy the test PDF to the tmp directory
tmp_pdf_path = os.path.join(TMP_DIR, f"{TEST_PDF_ID}.pdf")
shutil.copy(TEST_PDF_PATH, tmp_pdf_path)
logger.info(f"Copied test PDF to {tmp_pdf_path}")
print(f"Copied test PDF to {tmp_pdf_path}")

# Check if test JPG exists and copy it to the tmp directory
if TEST_IMAGE_PATH.exists():
    tmp_image_path = os.path.join(TMP_DIR, f"{TEST_IMAGE_ID}.jpg")
    shutil.copy(TEST_IMAGE_PATH, tmp_image_path)
    logger.info(f"Copied test JPG to {tmp_image_path}")
    print(f"Copied test JPG to {tmp_image_path}")
else:
    logger.info(f"Warning: Test JPG not found at {TEST_IMAGE_PATH}")
    print(f"Warning: Test JPG not found at {TEST_IMAGE_PATH}")
    logger.info("JPG tests will be skipped. Please add a sample resume image to run these tests.")
    print("JPG tests will be skipped. Please add a sample resume image to run these tests.")

# Check if test PNG exists and copy it to the tmp directory
if TEST_PNG_PATH.exists():
    tmp_png_path = os.path.join(TMP_DIR, f"{TEST_PNG_ID}.png")
    shutil.copy(TEST_PNG_PATH, tmp_png_path)
    logger.info(f"Copied test PNG to {tmp_png_path}")
    print(f"Copied test PNG to {tmp_png_path}")
else:
    logger.info(f"Warning: Test PNG not found at {TEST_PNG_PATH}")
    print(f"Warning: Test PNG not found at {TEST_PNG_PATH}")
    logger.info("PNG tests will be skipped. Please add a sample PNG file to run these tests.")
    print("PNG tests will be skipped. Please add a sample PNG file to run these tests.")

# Check if test HEIC exists and copy it to the tmp directory
if TEST_HEIC_PATH.exists():
    tmp_heic_path = os.path.join(TMP_DIR, f"{TEST_HEIC_ID}.heic")
    shutil.copy(TEST_HEIC_PATH, tmp_heic_path)
    logger.info(f"Copied test HEIC to {tmp_heic_path}")
    print(f"Copied test HEIC to {tmp_heic_path}")
else:
    logger.info(f"Warning: Test HEIC not found at {TEST_HEIC_PATH}")
    print(f"Warning: Test HEIC not found at {TEST_HEIC_PATH}")
    logger.info("HEIC tests will be skipped. Please add a sample HEIC file to run these tests.")
    print("HEIC tests will be skipped. Please add a sample HEIC file to run these tests.")

def pretty_print(title, data):
    """Print data in a nice format"""
    separator = "=" * 80
    centered_title = f" {title} ".center(80, "=")
    output = f"\n{separator}\n{centered_title}\n{separator}\n"
    
    if isinstance(data, dict):
        output += json.dumps(data, indent=2, ensure_ascii=False)
    else:
        output += str(data)
    
    output += f"\n{separator}\n"
    
    # Ausgabe sowohl in die Konsole als auch ins Log
    print(output)
    logger.info(output)

def test_layout_agent_pdf():
    """Test the LayoutAgent with PDF"""
    logger.info("\nTesting LayoutAgent with PDF...")
    print("\nTesting LayoutAgent with PDF...")
    agent = LayoutAgent()
    try:
        result = agent.analyze_layout(TEST_PDF_ID)
        pretty_print("LayoutAgent PDF Result", result)
        return True
    except Exception as e:
        error_msg = f"Error testing LayoutAgent with PDF: {e}"
        logger.error(error_msg)
        print(error_msg)
        return False

def test_layout_agent_image():
    """Test the LayoutAgent with Image"""
    if not Path(os.path.join(TMP_DIR, f"{TEST_IMAGE_ID}.jpg")).exists():
        logger.info("Skipping image test - no test image available")
        print("Skipping image test - no test image available")
        return True  # Skip test but don't fail
        
    logger.info("\nTesting LayoutAgent with Image...")
    print("\nTesting LayoutAgent with Image...")
    agent = LayoutAgent()
    try:
        # Direkt OCR-Ergebnisse ausgeben
        ocr_info = "\n--- OCR-Ergebnisse für JPG ---"
        logger.info(ocr_info)
        print(ocr_info)
        
        import easyocr
        reader = easyocr.Reader(['en'])
        ocr_results = reader.readtext(os.path.join(TMP_DIR, f"{TEST_IMAGE_ID}.jpg"), detail=1)
        for i, (bbox, text, prob) in enumerate(ocr_results):
            result_info = f"Text {i+1}: '{text}' (Konfidenz: {prob:.2f})"
            position_info = f"  Position: {bbox}"
            logger.info(result_info)
            logger.info(position_info)
            print(result_info)
            print(position_info)
        
        result = agent.analyze_layout(TEST_IMAGE_ID)
        pretty_print("LayoutAgent Image Result", result)
        return True
    except Exception as e:
        error_msg = f"Error testing LayoutAgent with Image: {e}"
        logger.error(error_msg)
        print(error_msg)
        return False

def test_layout_agent_png():
    """Test the LayoutAgent with PNG"""
    if not Path(os.path.join(TMP_DIR, f"{TEST_PNG_ID}.png")).exists():
        logger.info("Skipping PNG test - no test PNG available")
        print("Skipping PNG test - no test PNG available")
        return True  # Skip test but don't fail
        
    logger.info("\nTesting LayoutAgent with PNG...")
    print("\nTesting LayoutAgent with PNG...")
    agent = LayoutAgent()
    try:
        # Direkt OCR-Ergebnisse ausgeben
        ocr_info = "\n--- OCR-Ergebnisse für PNG ---"
        logger.info(ocr_info)
        print(ocr_info)
        
        import easyocr
        reader = easyocr.Reader(['en'])
        ocr_results = reader.readtext(os.path.join(TMP_DIR, f"{TEST_PNG_ID}.png"), detail=1)
        for i, (bbox, text, prob) in enumerate(ocr_results):
            result_info = f"Text {i+1}: '{text}' (Konfidenz: {prob:.2f})"
            position_info = f"  Position: {bbox}"
            logger.info(result_info)
            logger.info(position_info)
            print(result_info)
            print(position_info)
            
        result = agent.analyze_layout(TEST_PNG_ID)
        pretty_print("LayoutAgent PNG Result", result)
        return True
    except Exception as e:
        error_msg = f"Error testing LayoutAgent with PNG: {e}"
        logger.error(error_msg)
        print(error_msg)
        return False

def test_layout_agent_heic():
    """Test the LayoutAgent with HEIC"""
    if not Path(os.path.join(TMP_DIR, f"{TEST_HEIC_ID}.heic")).exists():
        logger.info("Skipping HEIC test - no test HEIC available")
        print("Skipping HEIC test - no test HEIC available")
        return True  # Skip test but don't fail
        
    logger.info("\nTesting LayoutAgent with HEIC...")
    print("\nTesting LayoutAgent with HEIC...")
    agent = LayoutAgent()
    try:
        # Direkt OCR-Ergebnisse ausgeben
        ocr_info = "\n--- OCR-Ergebnisse für HEIC ---"
        logger.info(ocr_info)
        print(ocr_info)
        
        import easyocr
        import pillow_heif
        from PIL import Image
        
        # HEIC in JPEG konvertieren für OCR
        pillow_heif.register_heif_opener()
        heic_path = os.path.join(TMP_DIR, f"{TEST_HEIC_ID}.heic")
        temp_jpg_path = os.path.join(TMP_DIR, f"temp_{TEST_HEIC_ID}.jpg")
        
        with Image.open(heic_path) as img:
            img.save(temp_jpg_path, "JPEG")
            
        # OCR auf dem konvertierten Bild durchführen
        reader = easyocr.Reader(['en'])
        ocr_results = reader.readtext(temp_jpg_path, detail=1)
        for i, (bbox, text, prob) in enumerate(ocr_results):
            result_info = f"Text {i+1}: '{text}' (Konfidenz: {prob:.2f})"
            position_info = f"  Position: {bbox}"
            logger.info(result_info)
            logger.info(position_info)
            print(result_info)
            print(position_info)
            
        # Temporäre Datei löschen
        try:
            os.remove(temp_jpg_path)
        except:
            pass
            
        result = agent.analyze_layout(TEST_HEIC_ID)
        pretty_print("LayoutAgent HEIC Result", result)
        return True
    except Exception as e:
        error_msg = f"Error testing LayoutAgent with HEIC: {e}"
        logger.error(error_msg)
        print(error_msg)
        return False

def test_parser_agent_pdf():
    """Test the ParserAgent with PDF"""
    logger.info("\nTesting ParserAgent with PDF...")
    print("\nTesting ParserAgent with PDF...")
    agent = ParserAgent()
    try:
        result = agent.parse_with_sections(TEST_PDF_ID)
        pretty_print("ParserAgent PDF Result", result)
        return True
    except Exception as e:
        error_msg = f"Error testing ParserAgent with PDF: {e}"
        logger.error(error_msg)
        print(error_msg)
        return False

def test_parser_agent_image():
    """Test the ParserAgent with Image"""
    if not Path(os.path.join(TMP_DIR, f"{TEST_IMAGE_ID}.jpg")).exists():
        logger.info("Skipping image test - no test image available")
        print("Skipping image test - no test image available")
        return True  # Skip test but don't fail
        
    logger.info("\nTesting ParserAgent with Image...")
    print("\nTesting ParserAgent with Image...")
    agent = ParserAgent()
    try:
        # Direkt OCR-Ergebnisse ausgeben
        ocr_info = "\n--- OCR-Ergebnisse (Parser) für JPG ---"
        logger.info(ocr_info)
        print(ocr_info)
        
        import easyocr
        reader = easyocr.Reader(['en'])
        ocr_results = reader.readtext(os.path.join(TMP_DIR, f"{TEST_IMAGE_ID}.jpg"), detail=0)
        logger.info("Extrahierter Text:")
        logger.info("\n".join(ocr_results))
        print("Extrahierter Text:")
        print("\n".join(ocr_results))
        
        result = agent.parse_with_sections(TEST_IMAGE_ID)
        pretty_print("ParserAgent Image Result", result)
        return True
    except Exception as e:
        error_msg = f"Error testing ParserAgent with Image: {e}"
        logger.error(error_msg)
        print(error_msg)
        return False

def test_parser_agent_png():
    """Test the ParserAgent with PNG"""
    if not Path(os.path.join(TMP_DIR, f"{TEST_PNG_ID}.png")).exists():
        logger.info("Skipping PNG test - no test PNG available")
        print("Skipping PNG test - no test PNG available")
        return True  # Skip test but don't fail
        
    logger.info("\nTesting ParserAgent with PNG...")
    print("\nTesting ParserAgent with PNG...")
    agent = ParserAgent()
    try:
        # Direkt OCR-Ergebnisse ausgeben
        ocr_info = "\n--- OCR-Ergebnisse (Parser) für PNG ---"
        logger.info(ocr_info)
        print(ocr_info)
        
        import easyocr
        reader = easyocr.Reader(['en'])
        ocr_results = reader.readtext(os.path.join(TMP_DIR, f"{TEST_PNG_ID}.png"), detail=0)
        logger.info("Extrahierter Text:")
        logger.info("\n".join(ocr_results))
        print("Extrahierter Text:")
        print("\n".join(ocr_results))
        
        result = agent.parse_with_sections(TEST_PNG_ID)
        pretty_print("ParserAgent PNG Result", result)
        return True
    except Exception as e:
        error_msg = f"Error testing ParserAgent with PNG: {e}"
        logger.error(error_msg)
        print(error_msg)
        return False

def test_parser_agent_heic():
    """Test the ParserAgent with HEIC"""
    if not Path(os.path.join(TMP_DIR, f"{TEST_HEIC_ID}.heic")).exists():
        logger.info("Skipping HEIC test - no test HEIC available")
        print("Skipping HEIC test - no test HEIC available")
        return True  # Skip test but don't fail
        
    logger.info("\nTesting ParserAgent with HEIC...")
    print("\nTesting ParserAgent with HEIC...")
    agent = ParserAgent()
    try:
        # Direkt OCR-Ergebnisse ausgeben
        ocr_info = "\n--- OCR-Ergebnisse (Parser) für HEIC ---"
        logger.info(ocr_info)
        print(ocr_info)
        
        import easyocr
        import pillow_heif
        from PIL import Image
        
        # HEIC in JPEG konvertieren für OCR
        pillow_heif.register_heif_opener()
        heic_path = os.path.join(TMP_DIR, f"{TEST_HEIC_ID}.heic")
        temp_jpg_path = os.path.join(TMP_DIR, f"temp_{TEST_HEIC_ID}.jpg")
        
        with Image.open(heic_path) as img:
            img.save(temp_jpg_path, "JPEG")
            
        # OCR auf dem konvertierten Bild durchführen
        reader = easyocr.Reader(['en'])
        ocr_results = reader.readtext(temp_jpg_path, detail=0)
        logger.info("Extrahierter Text:")
        logger.info("\n".join(ocr_results))
        print("Extrahierter Text:")
        print("\n".join(ocr_results))
        
        # Temporäre Datei löschen
        try:
            os.remove(temp_jpg_path)
        except:
            pass
        
        result = agent.parse_with_sections(TEST_HEIC_ID)
        pretty_print("ParserAgent HEIC Result", result)
        return True
    except Exception as e:
        error_msg = f"Error testing ParserAgent with HEIC: {e}"
        logger.error(error_msg)
        print(error_msg)
        return False

def test_quality_agent():
    """Test the QualityAgent"""
    logger.info("\nTesting QualityAgent...")
    print("\nTesting QualityAgent...")
    # First get parsed resume data
    parser = ParserAgent()
    layout_agent = LayoutAgent()
    
    try:
        resume_data = parser.parse_with_sections(TEST_PDF_ID)
        layout_data = layout_agent.analyze_layout(TEST_PDF_ID)
        
        agent = QualityAgent()
        result = agent.evaluate_resume(resume_data, layout_data)
        pretty_print("QualityAgent Result", result)
        return True
    except Exception as e:
        error_msg = f"Error testing QualityAgent: {e}"
        logger.error(error_msg)
        print(error_msg)
        return False

def test_match_agent():
    """Test the MatchAgent"""
    logger.info("\nTesting MatchAgent...")
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
        resume_data = parser.parse_with_sections(TEST_PDF_ID)
        
        agent = MatchAgent()
        result = agent.match_jobs(resume_data, job_descriptions)
        pretty_print("MatchAgent Result", result)
        return True
    except Exception as e:
        error_msg = f"Error testing MatchAgent: {e}"
        logger.error(error_msg)
        print(error_msg)
        return False

if __name__ == "__main__":
    start_msg = "Starting agent tests..."
    logger.info(start_msg)
    print(start_msg)
    
    # Test each agent
    layout_pdf_success = test_layout_agent_pdf()
    layout_image_success = test_layout_agent_image()
    layout_png_success = test_layout_agent_png()
    layout_heic_success = test_layout_agent_heic()
    parser_pdf_success = test_parser_agent_pdf()
    parser_image_success = test_parser_agent_image()
    parser_png_success = test_parser_agent_png()
    parser_heic_success = test_parser_agent_heic()
    quality_success = test_quality_agent()
    match_success = test_match_agent()
    
    # Print summary
    separator = "=" * 80
    summary_header = " TEST RESULTS ".center(80, "=")
    summary = f"\n{separator}\n{summary_header}\n{separator}\n"
    summary += f"LayoutAgent (PDF):   {'✅ PASS' if layout_pdf_success else '❌ FAIL'}\n"
    summary += f"LayoutAgent (Image): {'✅ PASS' if layout_image_success else '❌ FAIL'}\n"
    summary += f"LayoutAgent (PNG):   {'✅ PASS' if layout_png_success else '❌ FAIL'}\n"
    summary += f"LayoutAgent (HEIC):  {'✅ PASS' if layout_heic_success else '❌ FAIL'}\n"
    summary += f"ParserAgent (PDF):   {'✅ PASS' if parser_pdf_success else '❌ FAIL'}\n"
    summary += f"ParserAgent (Image): {'✅ PASS' if parser_image_success else '❌ FAIL'}\n"
    summary += f"ParserAgent (PNG):   {'✅ PASS' if parser_png_success else '❌ FAIL'}\n"
    summary += f"ParserAgent (HEIC):  {'✅ PASS' if parser_heic_success else '❌ FAIL'}\n"
    summary += f"QualityAgent:        {'✅ PASS' if quality_success else '❌ FAIL'}\n"
    summary += f"MatchAgent:          {'✅ PASS' if match_success else '❌ FAIL'}\n"
    summary += f"{separator}\n"
    
    logger.info(summary)
    print(summary)
    
    logger.info(f"Test log saved to: {log_file}")
    print(f"Test log saved to: {log_file}")
