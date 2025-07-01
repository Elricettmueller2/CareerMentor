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
        Analyze the layout of a document (PDF or image).
        
        Args:
            upload_id: ID of the uploaded file
            
        Returns:
            Dictionary with layout metrics
        """
        # Check for different possible file extensions
        possible_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.heic']
        found_path = None
        
        for ext in possible_extensions:
            path = os.path.join(self.tmp_dir, f"{upload_id}{ext}")
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
            # Determine if it's a vector or scanned PDF
            is_scanned = self._is_scanned_pdf(found_path)
            
            if is_scanned:
                logger.info(f"Analyzing scanned PDF: {found_path}")
                return self._analyze_scanned_pdf(found_path)
            else:
                logger.info(f"Analyzing vector PDF: {found_path}")
                return self._analyze_vector_pdf(found_path)
        elif ext in ['.jpg', '.jpeg', '.png']:
            logger.info(f"Analyzing image file: {found_path}")
            return self._analyze_image(found_path)
        elif ext == '.heic':
            logger.info(f"Analyzing HEIC image file: {found_path}")
            # Convert HEIC to JPG first, then analyze
            return self._analyze_heic_image(found_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")
    
    def _is_scanned_pdf(self, pdf_path: str) -> bool:
        """
        Determine if a PDF is a scanned document or a vector PDF.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            True if the PDF appears to be scanned, False otherwise
        """
        try:
            doc = fitz.open(pdf_path)
            
            # Check a sample of pages (up to first 3)
            pages_to_check = min(3, len(doc))
            text_count = 0
            image_count = 0
            
            for page_num in range(pages_to_check):
                page = doc[page_num]
                
                # Count text elements
                text = page.get_text()
                text_count += len(text)
                
                # Count images
                image_list = page.get_images(full=True)
                image_count += len(image_list)
            
            # If there are few text elements but images are present, likely a scanned PDF
            if text_count < 200 and image_count > 0:
                logger.info(f"PDF appears to be scanned: text_count={text_count}, image_count={image_count}")
                return True
                
            # If there's a reasonable amount of text, it's likely a vector PDF
            if text_count > 200:
                logger.info(f"PDF appears to be vector: text_count={text_count}, image_count={image_count}")
                return False
                
            # Default to treating as vector PDF
            return False
            
        except Exception as e:
            logger.error(f"Error determining if PDF is scanned: {str(e)}")
            # Default to treating as vector PDF on error
            return False
    
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
        Extract layout metrics from a scanned PDF using OCR and position analysis.
        Uses the same approach as image analysis since scanned PDFs are essentially images.
        
        Args:
            path: Path to the PDF file
            
        Returns:
            Dictionary with layout metrics
        """
        try:
            import easyocr
            import numpy as np
            
            doc = fitz.open(path)
            metrics = {
                "page_count": len(doc),
                "dimensions": []
            }
            
            # We'll analyze the first page in detail
            if len(doc) > 0:
                page = doc[0]
                width, height = page.rect.width, page.rect.height
                metrics["dimensions"].append({"width": width, "height": height})
                
                # Convert first page to image for OCR
                pix = page.get_pixmap()
                img_path = os.path.join(self.tmp_dir, f"temp_scan_{os.path.basename(path)}.png")
                pix.save(img_path)
                
                logger.info(f"Converted PDF page to image for OCR analysis: {img_path}")
                
                # Initialize OCR reader
                reader = easyocr.Reader(['en'])
                logger.info(f"Running OCR on scanned PDF page")
                
                # Perform OCR with bounding box detection
                results = reader.readtext(img_path)
                logger.info(f"OCR completed with {len(results)} text blocks detected")
                
                # Clean up temporary image
                try:
                    os.remove(img_path)
                except:
                    pass
                
                if not results:
                    logger.warning("No text detected in scanned PDF")
                    return {
                        "page_count": len(doc),
                        "dimensions": metrics["dimensions"],
                        "text_detected": False,
                        "warning": "No text detected in scanned PDF"
                    }
                
                # Extract text blocks with positions
                text_blocks = []
                for bbox, text, conf in results:
                    # bbox is [[x1,y1], [x2,y1], [x2,y2], [x1,y2]]
                    # Convert to [x1, y1, x2, y2] format (left, top, right, bottom)
                    x1, y1 = bbox[0]
                    x2, y2 = bbox[2]
                    
                    # Skip very low confidence detections
                    if conf < 0.2:
                        continue
                        
                    text_blocks.append({
                        "text": text,
                        "confidence": conf,
                        "bbox": [x1, y1, x2, y2],
                        "width": x2 - x1,
                        "height": y2 - y1,
                        "area": (x2 - x1) * (y2 - y1),
                        "center_x": (x1 + x2) / 2,
                        "center_y": (y1 + y2) / 2
                    })
                
                # Sort blocks by vertical position (top to bottom)
                text_blocks.sort(key=lambda b: b["bbox"][1])
                
                # Analyze layout structure
                
                # 1. Detect potential headers (larger text or positioned at top)
                # Calculate text size statistics
                text_heights = [block["height"] for block in text_blocks]
                avg_height = np.mean(text_heights) if text_heights else 0
                std_height = np.std(text_heights) if text_heights else 0
                
                # Mark potential headers (text significantly larger than average)
                headers = []
                for block in text_blocks:
                    # Text is significantly larger than average or in top 10% of page
                    is_large = block["height"] > (avg_height + 0.8 * std_height)
                    is_at_top = block["bbox"][1] < (height * 0.1)
                    
                    if is_large or is_at_top:
                        headers.append({
                            "text": block["text"],
                            "position": [block["bbox"][0], block["bbox"][1]],
                            "width": block["width"],
                            "height": block["height"]
                        })
                
                # 2. Detect columns based on text block positions
                x_positions = [block["center_x"] for block in text_blocks]
                x_positions.sort()
                
                # Simple column detection using clustering of x positions
                columns = 1  # Default
                if len(x_positions) > 5:  # Need enough text blocks for reliable detection
                    # Calculate differences between consecutive x positions
                    x_diffs = [x_positions[i+1] - x_positions[i] for i in range(len(x_positions)-1)]
                    
                    # Large gaps might indicate column separation
                    significant_gaps = [diff for diff in x_diffs if diff > (width * 0.15)]
                    if significant_gaps:
                        columns = len(significant_gaps) + 1
                        columns = min(columns, 3)  # Cap at 3 columns
                
                # 3. Estimate margins
                left_margin = min([block["bbox"][0] for block in text_blocks]) if text_blocks else 0
                right_margin = width - max([block["bbox"][2] for block in text_blocks]) if text_blocks else 0
                top_margin = min([block["bbox"][1] for block in text_blocks]) if text_blocks else 0
                bottom_margin = height - max([block["bbox"][3] for block in text_blocks]) if text_blocks else 0
                
                # 4. Detect sections based on vertical spacing
                sections = []
                y_positions = [block["bbox"][1] for block in text_blocks]
                y_positions.sort()
                
                if len(y_positions) > 5:
                    # Calculate differences between consecutive y positions
                    y_diffs = [y_positions[i+1] - y_positions[i] for i in range(len(y_positions)-1)]
                    avg_diff = np.mean(y_diffs)
                    
                    # Large vertical gaps might indicate section breaks
                    section_breaks = [i for i, diff in enumerate(y_diffs) if diff > (2 * avg_diff)]
                    
                    # Group text blocks into sections
                    current_section = []
                    current_section_y = 0
                    
                    for i, block in enumerate(text_blocks):
                        if i-1 in section_breaks:
                            # Start a new section
                            if current_section:
                                section_text = " ".join([b["text"] for b in current_section[:3]])
                                sections.append({
                                    "y_position": current_section_y,
                                    "sample_text": section_text[:50] + "..." if len(section_text) > 50 else section_text
                                })
                            current_section = [block]
                            current_section_y = block["bbox"][1]
                        else:
                            current_section.append(block)
                    
                    # Add the last section
                    if current_section:
                        section_text = " ".join([b["text"] for b in current_section[:3]])
                        sections.append({
                            "y_position": current_section_y,
                            "sample_text": section_text[:50] + "..." if len(section_text) > 50 else section_text
                        })
                
                # Compile metrics in a format similar to vector PDF analysis
                enhanced_metrics = {
                    "page_count": len(doc),
                    "dimensions": metrics["dimensions"],
                    "text_detected": True,
                    "text_blocks_count": len(text_blocks),
                    "columns": columns,
                    "margins": {
                        "left": left_margin,
                        "right": right_margin,
                        "top": top_margin,
                        "bottom": bottom_margin
                    },
                    "headers": headers[:5],  # Limit to top 5 headers
                    "sections": sections[:10],  # Limit to top 10 sections
                    "avg_text_height": float(avg_height),
                    "layout_confidence": "medium"  # OCR-based layout analysis is less reliable than vector PDF
                }
                
                logger.info(f"Scanned PDF layout analysis completed: detected {len(headers)} headers, {columns} columns, {len(sections)} sections")
                return enhanced_metrics
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error analyzing scanned PDF layout: {str(e)}")
            logger.error(traceback.format_exc())
            # Fall back to basic metrics
            try:
                doc = fitz.open(path)
                return {
                    "page_count": len(doc),
                    "dimensions": [{"width": doc[0].rect.width, "height": doc[0].rect.height}] if len(doc) > 0 else [],
                    "error": str(e),
                    "text_detected": False,
                    "layout_confidence": "none"
                }
            except:
                return {
                    "error": str(e),
                    "text_detected": False,
                    "layout_confidence": "none"
                }
    
    def _analyze_image(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze the layout of an image file using OCR and heuristics.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with layout metrics
        """
        try:
            import easyocr
            logger.info(f"Running OCR on image: {image_path}")
            
            # Initialize OCR reader
            reader = easyocr.Reader(['en'])
            
            # Run OCR to get text blocks with positions
            result = reader.readtext(image_path)
            
            # Extract text blocks with their positions
            blocks = []
            for detection in result:
                bbox = detection[0]  # [[x1,y1], [x2,y1], [x2,y2], [x1,y2]]
                text = detection[1]
                confidence = detection[2]
                
                # Calculate center position and dimensions
                x1, y1 = bbox[0]
                x2, y2 = bbox[2]
                center_x = (x1 + x2) / 2
                center_y = (y1 + y2) / 2
                width = x2 - x1
                height = y2 - y1
                
                blocks.append({
                    "text": text,
                    "confidence": float(confidence),  # Convert numpy float to Python float
                    "center_x": float(center_x),      # Convert numpy float to Python float
                    "center_y": float(center_y),      # Convert numpy float to Python float
                    "width": float(width),            # Convert numpy float to Python float
                    "height": float(height),          # Convert numpy float to Python float
                    "x1": float(x1),                  # Convert numpy float to Python float
                    "y1": float(y1),                  # Convert numpy float to Python float
                    "x2": float(x2),                  # Convert numpy float to Python float
                    "y2": float(y2)                   # Convert numpy float to Python float
                })
            
            logger.info(f"OCR completed with {len(blocks)} text blocks detected")
            
            # Analyze layout based on the OCR results
            # 1. Identify potential headers (larger text, bold, at the top of sections)
            headers = self._identify_headers(blocks)
            
            # 2. Identify columns
            columns = self._identify_columns(blocks)
            
            # 3. Identify margins
            margins = self._identify_margins(blocks)
            
            # 4. Identify sections
            sections = self._identify_sections(blocks, headers)
            
            logger.info(f"Image layout analysis completed: detected {len(headers)} headers, {columns} columns, {len(sections)} sections")
            
            # Return the layout analysis results
            return {
                "document_type": "image",
                "page_count": 1,
                "has_columns": columns > 1,
                "column_count": columns,
                "margins": margins,
                "headers": len(headers),
                "sections": len(sections),
                "text_blocks": len(blocks),
                "is_structured": len(sections) > 3,  # Consider structured if it has several sections
                "layout_quality": self._calculate_layout_quality(blocks, headers, sections, columns)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image layout: {str(e)}")
            raise
    
    def _analyze_heic_image(self, path: str) -> Dict[str, Any]:
        """
        Extract layout metrics from a HEIC image file.
        Converts HEIC to JPEG first, then uses the standard image analysis.
        
        Args:
            path: Path to the HEIC file
            
        Returns:
            Dictionary with layout metrics
        """
        try:
            import pillow_heif
            from PIL import Image
            pillow_heif.register_heif_opener()
            
            # Convert HEIC to JPEG
            temp_jpg_path = os.path.join(self.tmp_dir, f"temp_{os.path.basename(path)}.jpg")
            
            # Open and convert the HEIC image
            with Image.open(path) as img:
                # Save as JPEG
                img.save(temp_jpg_path, "JPEG")
                
            logger.info(f"Converted HEIC to JPEG: {temp_jpg_path}")
            
            # Analyze the converted image
            result = self._analyze_image(temp_jpg_path)
            
            # Clean up temporary file
            try:
                os.remove(temp_jpg_path)
            except:
                pass
                
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing HEIC image: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                "error": str(e),
                "text_detected": False,
                "layout_confidence": "none"
            }

    def _identify_headers(self, blocks: List[Dict]) -> List[Dict]:
        """
        Identify potential headers in the document based on text properties.
        
        Args:
            blocks: List of text blocks with position and size information
            
        Returns:
            List of potential headers
        """
        if not blocks:
            return []
            
        # Calculate text height statistics
        heights = [block["height"] for block in blocks]
        avg_height = sum(heights) / len(heights)
        
        # Calculate standard deviation
        variance = sum((h - avg_height) ** 2 for h in heights) / len(heights)
        std_height = variance ** 0.5
        
        # Sort blocks by vertical position
        sorted_blocks = sorted(blocks, key=lambda b: b["y1"])
        
        # Find potential headers (larger text or at the top of sections)
        headers = []
        for block in sorted_blocks:
            # Text is significantly larger than average
            is_large = block["height"] > (avg_height + 0.8 * std_height)
            
            # Text is at the beginning of the document
            is_at_top = block["y1"] < sorted_blocks[0]["y1"] + (sorted_blocks[-1]["y2"] - sorted_blocks[0]["y1"]) * 0.1
            
            # Text is bold (approximated by width/height ratio)
            # This is a heuristic and not always accurate
            width_height_ratio = block["width"] / block["height"] if block["height"] > 0 else 0
            is_bold = width_height_ratio > 0.3 and width_height_ratio < 0.7
            
            if is_large or is_at_top or is_bold:
                headers.append({
                    "text": block["text"],
                    "position": [float(block["x1"]), float(block["y1"])],
                    "width": float(block["width"]),
                    "height": float(block["height"])
                })
                
        return headers
        
    def _identify_columns(self, blocks: List[Dict]) -> int:
        """
        Identify the number of columns in the document.
        
        Args:
            blocks: List of text blocks with position information
            
        Returns:
            Estimated number of columns
        """
        if not blocks:
            return 1
            
        # Get x-center positions of all blocks
        x_centers = [block["center_x"] for block in blocks]
        
        # Get document width
        min_x = min(block["x1"] for block in blocks)
        max_x = max(block["x2"] for block in blocks)
        doc_width = max_x - min_x
        
        # Simple column detection using clustering of x positions
        columns = 1  # Default
        
        if len(x_centers) > 5:  # Need enough text blocks for reliable detection
            # Sort x positions
            x_centers.sort()
            
            # Calculate differences between consecutive x positions
            x_diffs = [x_centers[i+1] - x_centers[i] for i in range(len(x_centers)-1)]
            
            # Large gaps might indicate column separation (at least 15% of document width)
            significant_gaps = [diff for diff in x_diffs if diff > (doc_width * 0.15)]
            
            if significant_gaps:
                columns = len(significant_gaps) + 1
                columns = min(columns, 3)  # Cap at 3 columns
                
        return columns
        
    def _identify_margins(self, blocks: List[Dict]) -> Dict[str, float]:
        """
        Identify document margins based on text block positions.
        
        Args:
            blocks: List of text blocks with position information
            
        Returns:
            Dictionary with margin measurements
        """
        if not blocks:
            return {"left": 0, "right": 0, "top": 0, "bottom": 0}
            
        # Find the extremes of text positions
        min_x = min(block["x1"] for block in blocks)
        max_x = max(block["x2"] for block in blocks)
        min_y = min(block["y1"] for block in blocks)
        max_y = max(block["y2"] for block in blocks)
        
        # Calculate document dimensions based on text positions
        # This is an approximation since we don't know the actual page dimensions
        doc_width = max_x - min_x + 2 * min_x  # Assuming left margin equals right margin
        doc_height = max_y - min_y + 2 * min_y  # Assuming top margin equals bottom margin
        
        # Calculate margins
        left_margin = float(min_x)
        right_margin = float(doc_width - max_x)
        top_margin = float(min_y)
        bottom_margin = float(doc_height - max_y)
        
        return {
            "left": left_margin,
            "right": right_margin,
            "top": top_margin,
            "bottom": bottom_margin
        }
        
    def _identify_sections(self, blocks: List[Dict], headers: List[Dict]) -> List[Dict]:
        """
        Identify document sections based on headers and vertical spacing.
        
        Args:
            blocks: List of text blocks with position information
            headers: List of identified headers
            
        Returns:
            List of identified sections
        """
        if not blocks:
            return []
            
        # Sort blocks by vertical position
        sorted_blocks = sorted(blocks, key=lambda b: b["y1"])
        
        # Get y positions
        y_positions = [block["y1"] for block in sorted_blocks]
        
        # Calculate average vertical spacing between text blocks
        y_diffs = [y_positions[i+1] - y_positions[i] for i in range(len(y_positions)-1)]
        avg_diff = sum(y_diffs) / len(y_diffs) if y_diffs else 0
        
        # Identify section breaks (significantly larger than average spacing)
        section_breaks = []
        for i, diff in enumerate(y_diffs):
            if diff > (2.5 * avg_diff):
                section_breaks.append(i)
                
        # Use headers as additional section indicators
        header_indices = []
        for header in headers:
            # Find the index of the block that corresponds to this header
            for i, block in enumerate(sorted_blocks):
                if abs(block["y1"] - header["position"][1]) < 5 and abs(block["x1"] - header["position"][0]) < 5:
                    header_indices.append(i)
                    break
                    
        # Combine section breaks from spacing and headers
        all_breaks = sorted(set(section_breaks + header_indices))
        
        # Create sections
        sections = []
        start_idx = 0
        
        for break_idx in all_breaks:
            if break_idx > start_idx:
                # Get text from the first few blocks in this section
                section_blocks = sorted_blocks[start_idx:break_idx+1]
                section_text = " ".join([b["text"] for b in section_blocks[:3]])
                
                sections.append({
                    "start_y": float(sorted_blocks[start_idx]["y1"]),
                    "end_y": float(sorted_blocks[break_idx]["y2"]),
                    "sample_text": section_text[:50] + ("..." if len(section_text) > 50 else "")
                })
                
                start_idx = break_idx + 1
                
        # Add the last section if needed
        if start_idx < len(sorted_blocks):
            section_blocks = sorted_blocks[start_idx:]
            section_text = " ".join([b["text"] for b in section_blocks[:3]])
            
            sections.append({
                "start_y": float(sorted_blocks[start_idx]["y1"]),
                "end_y": float(sorted_blocks[-1]["y2"]),
                "sample_text": section_text[:50] + ("..." if len(section_text) > 50 else "")
            })
            
        return sections
        
    def _calculate_layout_quality(self, blocks: List[Dict], headers: List[Dict], 
                                sections: List[Dict], columns: int) -> str:
        """
        Calculate a qualitative measure of layout quality.
        
        Args:
            blocks: List of text blocks
            headers: List of identified headers
            sections: List of identified sections
            columns: Number of columns
            
        Returns:
            Layout quality assessment ("high", "medium", "low")
        """
        # Count the number of quality indicators
        quality_score = 0
        
        # Good documents have multiple sections
        if len(sections) >= 3:
            quality_score += 1
            
        # Good documents have clear headers
        if len(headers) >= 2:
            quality_score += 1
            
        # Good documents have a reasonable number of text blocks
        if 20 <= len(blocks) <= 200:
            quality_score += 1
            
        # Good documents often have consistent formatting
        # Calculate height consistency of non-header blocks
        header_y_positions = [h["position"][1] for h in headers]
        non_header_blocks = []
        
        for block in blocks:
            is_header = False
            for header_y in header_y_positions:
                if abs(block["y1"] - header_y) < 5:
                    is_header = True
                    break
            if not is_header:
                non_header_blocks.append(block)
                
        if non_header_blocks:
            heights = [block["height"] for block in non_header_blocks]
            avg_height = sum(heights) / len(heights)
            height_diffs = [abs(h - avg_height) for h in heights]
            avg_height_diff = sum(height_diffs) / len(height_diffs)
            
            # If height is consistent (small average difference)
            if avg_height_diff < (avg_height * 0.3):
                quality_score += 1
                
        # Map score to quality level
        if quality_score >= 3:
            return "high"
        elif quality_score >= 1:
            return "medium"
        else:
            return "low"
