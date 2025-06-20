import os
import fitz  # PyMuPDF
import numpy as np
import logging
import traceback
from typing import Dict, Any, Tuple, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LayoutAgent:
    """
    Agent responsible for analyzing the layout of PDF documents.
    Detects whether a PDF contains embedded text (vector PDF) or is a scanned document,
    and extracts layout metrics accordingly.
    """
    
    def __init__(self):
        self.tmp_dir = "/tmp/resumes"
        os.makedirs(self.tmp_dir, exist_ok=True)
        logger.info(f"LayoutAgent initialized with tmp_dir: {self.tmp_dir}")
    
    def analyze_layout(self, upload_id: str) -> Dict[str, Any]:
        """
        Main entry point for layout analysis.
        Determines PDF type and extracts appropriate metrics.
        
        Args:
            upload_id: ID of the uploaded PDF file
            
        Returns:
            Dictionary with layout metrics and PDF type information
        """
        try:
            path = os.path.join(self.tmp_dir, f"{upload_id}.pdf")
            logger.info(f"Analyzing layout for PDF at path: {path}")
            
            if not os.path.exists(path):
                logger.error(f"PDF file not found for upload_id: {upload_id}")
                raise FileNotFoundError(f"PDF file not found for upload_id: {upload_id}")
            
            logger.info(f"File exists, size: {os.path.getsize(path)} bytes")
            
            # Determine if the PDF has embedded text or is a scan
            try:
                is_vector_pdf, confidence = self._detect_pdf_type(path)
                logger.info(f"PDF type detection: vector={is_vector_pdf}, confidence={confidence}")
            except Exception as e:
                logger.error(f"Error in _detect_pdf_type: {str(e)}")
                logger.error(traceback.format_exc())
                raise
            
            # Extract metrics based on PDF type
            try:
                if is_vector_pdf:
                    metrics = self._analyze_vector_pdf(path)
                else:
                    metrics = self._analyze_scanned_pdf(path)
                logger.info(f"Successfully extracted metrics: {metrics}")
            except Exception as e:
                logger.error(f"Error in PDF analysis: {str(e)}")
                logger.error(traceback.format_exc())
                raise
            
            result = {
                "pdf_type": "vector" if is_vector_pdf else "scanned",
                "type_confidence": confidence,
                "metrics": metrics
            }
            logger.info(f"Layout analysis completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Unexpected error in analyze_layout: {str(e)}")
            logger.error(traceback.format_exc())
            # Re-raise the exception after logging it
            raise
    
    def _detect_pdf_type(self, path: str) -> Tuple[bool, float]:
        """
        Determine if a PDF contains embedded text (vector) or is a scanned document.
        
        Returns:
            Tuple of (is_vector_pdf, confidence)
        """
        doc = fitz.open(path)
        text_count = 0
        page_count = len(doc)
        
        # Check first 3 pages or all pages if fewer
        check_pages = min(3, page_count)
        
        for page_num in range(check_pages):
            page = doc[page_num]
            text = page.get_text()
            if len(text.strip()) > 50:  # If page has substantial text
                text_count += 1
        
        # Calculate confidence based on text presence
        confidence = text_count / check_pages
        is_vector_pdf = confidence > 0.5
        
        return is_vector_pdf, confidence
    
    def _analyze_vector_pdf(self, path: str) -> Dict[str, Any]:
        """
        Extract layout metrics from a vector PDF with embedded text.
        
        Returns:
            Dictionary with layout metrics
        """
        doc = fitz.open(path)
        metrics = {
            "page_count": len(doc),
            "margins": [],
            "font_sizes": [],
            "columns": [],
            "headers": []
        }
        
        for page_num in range(min(2, len(doc))):  # Analyze first 2 pages
            page = doc[page_num]
            
            # Extract page dimensions
            width, height = page.rect.width, page.rect.height
            
            # Extract text blocks for margin analysis
            blocks = page.get_text("blocks")
            if blocks:
                # Estimate margins
                left_margins = [block[0] for block in blocks]
                right_margins = [width - block[2] for block in blocks]
                top_margins = [block[1] for block in blocks]
                bottom_margins = [height - block[3] for block in blocks]
                
                page_margins = {
                    "left": min(left_margins) if left_margins else 0,
                    "right": min(right_margins) if right_margins else 0,
                    "top": min(top_margins) if top_margins else 0,
                    "bottom": min(bottom_margins) if bottom_margins else 0
                }
                metrics["margins"].append(page_margins)
                
                # Estimate column count based on block positions
                x_positions = sorted([block[0] for block in blocks])
                if len(x_positions) > 1:
                    # Simple heuristic: significant jumps in x position might indicate columns
                    x_diffs = [x_positions[i+1] - x_positions[i] for i in range(len(x_positions)-1)]
                    significant_jumps = [diff for diff in x_diffs if diff > width * 0.2]
                    estimated_columns = len(significant_jumps) + 1
                    metrics["columns"].append(min(estimated_columns, 3))  # Cap at 3 columns
                else:
                    metrics["columns"].append(1)
            
            # Extract font information
            font_dict = {}
            for span in page.get_text("dict")["blocks"]:
                if "lines" in span:
                    for line in span["lines"]:
                        for span in line["spans"]:
                            size = span["size"]
                            font_dict[size] = font_dict.get(size, 0) + len(span["text"])
            
            # Get most common font sizes
            if font_dict:
                sorted_sizes = sorted(font_dict.items(), key=lambda x: x[1], reverse=True)
                metrics["font_sizes"].append([size for size, _ in sorted_sizes[:3]])
        
        return metrics
    
    def _analyze_scanned_pdf(self, path: str) -> Dict[str, Any]:
        """
        Extract basic layout metrics from a scanned PDF.
        For scanned documents, we can only provide basic information.
        
        Returns:
            Dictionary with basic layout metrics
        """
        doc = fitz.open(path)
        metrics = {
            "page_count": len(doc),
            "dimensions": []
        }
        
        for page_num in range(min(2, len(doc))):  # Analyze first 2 pages
            page = doc[page_num]
            width, height = page.rect.width, page.rect.height
            metrics["dimensions"].append({"width": width, "height": height})
            
            # For scanned PDFs, we could potentially use image analysis in the future
            # This would be a good place to integrate Vision-LLM capabilities
        
        return metrics
