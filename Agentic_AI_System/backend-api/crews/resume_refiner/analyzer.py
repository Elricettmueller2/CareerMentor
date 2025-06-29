import re
from typing import Dict

SECTION_HEADERS = {
    "profile": r"(?:Profile|Summary)",
    "experience": r"(?:Experience|Berufserfahrung)",
    "education": r"(?:Education|Ausbildung)",
    "skills": r"(?:Skills|Kenntnisse)"
}

class ResumeAnalyzer:
    def extract_sections(self, text: str) -> Dict[str, str]:
        """
        Split raw resume text into named sections based on header regex.
        """
        # Build a combined regex to find all headers
        pattern = "|".join(f"(?P<{k}>{v})" for k, v in SECTION_HEADERS.items())
        # Find all header positions
        matches = list(re.finditer(pattern, text, re.IGNORECASE))
        sections = {}
        for idx, m in enumerate(matches):
            sec_name = m.lastgroup
            start = m.end()
            end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
            sections[sec_name] = text[start:end].strip()
        # Ensure all keys exist
        for key in SECTION_HEADERS:
            sections.setdefault(key, "")
        return sections

    def extract_keywords(self, text: str, top_n: int = 10) -> list[str]:
        """
        Simple keyword extraction via TF-IDF or similar.
        Placeholder: split on whitespace and return most common words.
        """
        words = re.findall(r"\b\w{4,}\b", text.lower())
        freq = {}
        for w in words:
            freq[w] = freq.get(w, 0) + 1
        # sort by frequency
        return [w for w, _ in sorted(freq.items(), key=lambda kv: kv[1], reverse=True)[:top_n]