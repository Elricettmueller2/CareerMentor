import os
import uuid
import re
import logging
import mimetypes
from typing import Dict, List, Any
from pdfminer.high_level import extract_text
import easyocr
from fastapi import UploadFile
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize EasyOCR reader once
_reader = easyocr.Reader(['en'], gpu=False)

# Section headers for parsing
SECTION_HEADERS = {
    "profile": r"(?:Profile|Summary|Profil|Zusammenfassung)",
    "experience": r"(?:Experience|Work Experience|Employment|Berufserfahrung|Arbeitserfahrung)",
    "education": r"(?:Education|Academic|Ausbildung|Bildung|Studium)",
    "skills": r"(?:Skills|Competencies|Expertise|Kenntnisse|Fähigkeiten|Kompetenzen)"
}

class ParserAgent:
    """
    Agent responsible for extracting and processing text from resume PDFs.
    Handles file saving, text extraction with fallback to OCR, and section parsing.
    """
    
    TMP_DIR = "/tmp/resumes"
    
    def __init__(self):
        os.makedirs(self.TMP_DIR, exist_ok=True)
        logger.info(f"ParserAgent initialized with TMP_DIR: {self.TMP_DIR}")
    
    def save_upload(self, upload_file: UploadFile) -> str:
        """
        Save incoming UploadFile to disk and return upload_id.
        Handles both PDF and image files (JPG, PNG).
        """
        upload_id = str(uuid.uuid4())
        
        # Determine file extension from content type or filename
        content_type = upload_file.content_type or ''
        filename = upload_file.filename or ''
        
        if 'pdf' in content_type.lower() or filename.lower().endswith('.pdf'):
            extension = '.pdf'
        elif any(img_type in content_type.lower() for img_type in ['jpeg', 'jpg']):
            extension = '.jpg'
        elif 'png' in content_type.lower():
            extension = '.png'
        else:
            # Default to pdf if we can't determine the type
            extension = '.pdf'
            
        dest = os.path.join(self.TMP_DIR, f"{upload_id}{extension}")
        
        logger.info(f"Saving uploaded file to {dest}")
        
        try:
            # Make sure we're at the beginning of the file
            upload_file.file.seek(0)
            
            # Read the content
            content = upload_file.file.read()
            
            # Check if content is not empty
            if not content:
                logger.error("Uploaded file is empty")
                raise ValueError("Uploaded file is empty")
            
            logger.info(f"Read {len(content)} bytes from uploaded file")
            
            # Write content to file
            with open(dest, "wb") as f:
                f.write(content)
            
            # Verify file was written correctly
            file_size = os.path.getsize(dest)
            logger.info(f"File saved successfully. Size: {file_size} bytes")
            
            if file_size == 0:
                logger.error("File was saved but is empty")
                raise ValueError("File was saved but is empty")
                
            return upload_id
            
        except Exception as e:
            logger.error(f"Error saving uploaded file: {str(e)}")
            raise
    
    def parse(self, upload_id: str) -> str:
        """
        Extract plain text from a saved PDF or image file.
        For PDFs: Uses pdfminer with OCR fallback.
        For images: Uses OCR directly.
        
        Args:
            upload_id: ID of the uploaded file
            
        Returns:
            Extracted text from the file
        """
        # Check for different possible file extensions
        possible_extensions = ['.pdf', '.jpg', '.png']
        found_path = None
        
        for ext in possible_extensions:
            path = os.path.join(self.TMP_DIR, f"{upload_id}{ext}")
            if os.path.exists(path):
                found_path = path
                break
                
        if not found_path:
            raise FileNotFoundError(f"No file found for upload_id: {upload_id}")
        
        # Get the file extension
        _, ext = os.path.splitext(found_path)
        ext = ext.lower()
        
        # Process based on file type
        if ext == '.pdf':
            try:
                # Try extracting text with pdfminer
                text = extract_text(found_path)
                if text and text.strip():
                    return text
                raise ValueError("Empty text from pdfminer")
            except Exception as e:
                logger.info(f"PDF text extraction failed, falling back to OCR: {str(e)}")
                # OCR fallback for PDF
                result = _reader.readtext(found_path, detail=0)
                return "\n".join(result)
        else:  # Image files (.jpg, .png)
            logger.info(f"Processing image file with OCR: {found_path}")
            try:
                # Use OCR directly for images
                result = _reader.readtext(found_path, detail=0)
                return "\n".join(result)
            except Exception as e:
                logger.error(f"OCR processing failed: {str(e)}")
                raise
    
    def parse_with_sections(self, upload_id: str) -> Dict[str, Any]:
        """
        Extract text from PDF and organize it into sections.
        
        Args:
            upload_id: ID of the uploaded PDF file
            
        Returns:
            Dictionary with full text and parsed sections
        """
        # Get full text
        full_text = self.parse(upload_id)
        
        # Extract sections
        sections = self.extract_sections(full_text)
        
        # Extract keywords
        keywords = self.extract_keywords(full_text)
        
        return {
            "full_text": full_text,
            "sections": sections,
            "keywords": keywords
        }
    
    def extract_sections(self, text: str) -> Dict[str, str]:
        """
        Split raw resume text into named sections based on header regex.
        
        Args:
            text: Full text from the resume
            
        Returns:
            Dictionary with section names as keys and content as values
        """
        # Build a combined regex to find all headers
        pattern = "|".join(f"(?P<{k}>{v})" for k, v in SECTION_HEADERS.items())
        
        # Find all header positions
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        sections = {}
        
        if not matches:
            # If no sections found, return the entire text as "unclassified"
            sections["unclassified"] = text.strip()
            return sections
            
        for idx, m in enumerate(matches):
            sec_name = m.lastgroup
            start = m.end()
            end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
            sections[sec_name] = text[start:end].strip()
            
        # Ensure all keys exist
        for key in SECTION_HEADERS:
            sections.setdefault(key, "")
            
        return sections
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """
        Simple keyword extraction from text.
        
        Args:
            text: Text to extract keywords from
            top_n: Number of top keywords to return
            
        Returns:
            List of top keywords
        """
        # Remove common stopwords and short words
        words = re.findall(r"\b\w{4,}\b", text.lower())
        
        # Count word frequencies
        freq = {}
        for w in words:
            freq[w] = freq.get(w, 0) + 1
            
        # Sort by frequency and return top N
        return [w for w, _ in sorted(freq.items(), key=lambda kv: kv[1], reverse=True)[:top_n]]
