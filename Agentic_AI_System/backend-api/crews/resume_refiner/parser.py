import os
import uuid
from pdfminer.high_level import extract_text
import easyocr

# Initialize EasyOCR reader once
_reader = easyocr.Reader(['en'], gpu=False)

class ResumeParser:
    TMP_DIR = "/tmp/resumes"

    def __init__(self):
        os.makedirs(self.TMP_DIR, exist_ok=True)

    def save_upload(self, upload_file) -> str:
        """
        Save incoming UploadFile to disk and return upload_id.
        """
        upload_id = str(uuid.uuid4())
        dest = os.path.join(self.TMP_DIR, f"{upload_id}.pdf")
        with open(dest, "wb") as f:
            f.write(upload_file.file.read())
        return upload_id

    def parse(self, upload_id: str) -> str:
        """
        Extract plain text from a saved PDF. Falls back to OCR if necessary.
        """
        path = os.path.join(self.TMP_DIR, f"{upload_id}.pdf")
        try:
            text = extract_text(path)
            if text and text.strip():
                return text
            raise ValueError("Empty text from pdfminer")
        except Exception:
            # OCR fallback
            result = _reader.readtext(path, detail=0)
            return "\n".join(result)