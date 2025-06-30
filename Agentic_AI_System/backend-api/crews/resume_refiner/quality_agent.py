import re
from typing import Dict, List, Any
from litellm import completion

class QualityAgent:
    """
    Agent responsible for evaluating resume quality across multiple dimensions.
    Provides scores and actionable feedback for improvement.
    """
    
    # Categories for resume evaluation
    CATEGORIES = [
        "format_layout",
        "inhalt_struktur",
        "sprache_stil",
        "ergebnis_orientierung"
    ]
    
    def __init__(self):
        pass
    
    def evaluate_resume(self, resume_data: Dict[str, Any], layout_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Evaluate a resume across all quality dimensions.
        
        Args:
            resume_data: Dictionary with parsed resume text and sections
            layout_data: Optional layout analysis data
            
        Returns:
            Dictionary with scores and feedback for each category
        """
        full_text = resume_data.get("full_text", "")
        sections = resume_data.get("sections", {})
        
        # Initialize results structure
        results = {
            "scores": {},
            "feedback": {}
        }
        
        # Evaluate each category
        for category in self.CATEGORIES:
            score, feedback = self._evaluate_category(category, full_text, sections, layout_data)
            results["scores"][category] = score
            results["feedback"][category] = feedback
        
        # Calculate overall score (weighted average)
        weights = {
            "format_layout": 0.2,
            "inhalt_struktur": 0.3,
            "sprache_stil": 0.2,
            "ergebnis_orientierung": 0.3
        }
        
        weighted_sum = sum(results["scores"][cat] * weights[cat] for cat in self.CATEGORIES)
        total_weight = sum(weights.values())
        results["scores"]["overall"] = round(weighted_sum / total_weight, 1)
        
        return results
    
    def _evaluate_category(self, category: str, full_text: str, sections: Dict[str, str], 
                          layout_data: Dict[str, Any] = None) -> tuple[int, List[str]]:
        """
        Evaluate a specific category of the resume.
        
        Args:
            category: Category to evaluate
            full_text: Full resume text
            sections: Dictionary of resume sections
            layout_data: Optional layout analysis data
            
        Returns:
            Tuple of (score, feedback_list)
        """
        # Prepare category-specific prompt
        if category == "format_layout":
            prompt = self._build_format_prompt(full_text, layout_data)
        elif category == "inhalt_struktur":
            prompt = self._build_structure_prompt(sections)
        elif category == "sprache_stil":
            prompt = self._build_language_prompt(full_text)
        elif category == "ergebnis_orientierung":
            prompt = self._build_outcome_prompt(sections.get("experience", ""))
        else:
            raise ValueError(f"Unknown category: {category}")
        
        # Get LLM response
        response = self._llm_call(prompt)
        
        # Parse score and feedback
        score = self._extract_score(response)
        feedback = self._extract_feedback(response)
        
        return score, feedback
    
    def _build_format_prompt(self, text: str, layout_data: Dict[str, Any] = None) -> str:
        """Build prompt for format & layout evaluation"""
        prompt = """
You are a resume format expert. Evaluate the resume's format and layout based on the following criteria:
- Clear section organization
- Consistent spacing and margins
- Appropriate use of formatting (bold, italics, etc.)
- Professional appearance

Resume text:
"""
        # Add layout metrics if available
        if layout_data:
            prompt += "\nLayout metrics:\n"
            prompt += f"PDF type: {layout_data.get('pdf_type', 'unknown')}\n"
            
            metrics = layout_data.get("metrics", {})
            if "margins" in metrics and metrics["margins"]:
                margins = metrics["margins"][0]  # First page margins
                prompt += f"Margins: left={margins.get('left', 0):.1f}, right={margins.get('right', 0):.1f}, "
                prompt += f"top={margins.get('top', 0):.1f}, bottom={margins.get('bottom', 0):.1f}\n"
                
            if "font_sizes" in metrics and metrics["font_sizes"]:
                prompt += f"Font sizes: {', '.join(f'{size:.1f}' for size in metrics['font_sizes'][0])}\n"
                
            if "columns" in metrics and metrics["columns"]:
                prompt += f"Estimated columns: {metrics['columns'][0]}\n"
        
        prompt += f"\n{text[:1500]}...\n\n"  # Truncate text to avoid token limits
        
        prompt += """
Rate the format and layout on a scale from 0-100, where:
0-20: Poor (inconsistent, cluttered, hard to read)
21-40: Below Average (some structure but significant issues)
41-60: Average (readable but room for improvement)
61-80: Good (clear structure, minor inconsistencies)
81-100: Excellent (professional, consistent, optimized)

Provide 3-5 specific, actionable feedback points for improvement.

Your response must be in this format:
Score: [0-100]
Feedback:
- [Feedback point 1]
- [Feedback point 2]
- [Feedback point 3]
"""
        return prompt
    
    def _build_structure_prompt(self, sections: Dict[str, str]) -> str:
        """Build prompt for content & structure evaluation"""
        prompt = """
You are a resume content expert. Evaluate the resume's content and structure based on:
- Presence and completeness of key sections (Profile, Experience, Education, Skills)
- Logical flow between sections
- Appropriate level of detail in each section
- Relevance of included information

Resume sections:
"""
        # Add section information
        for section, content in sections.items():
            prompt += f"\n--- {section.upper()} ---\n"
            prompt += f"{content[:500]}...\n" if len(content) > 500 else f"{content}\n"
        
        prompt += """
Rate the content and structure on a scale from 0-100, where:
0-20: Poor (missing key sections, illogical organization)
21-40: Below Average (major gaps or irrelevant content)
41-60: Average (basic sections present but lacking detail)
61-80: Good (comprehensive with minor improvements needed)
81-100: Excellent (complete, well-organized, appropriate detail)

Provide 3-5 specific, actionable feedback points for improvement.

Your response must be in this format:
Score: [0-100]
Feedback:
- [Feedback point 1]
- [Feedback point 2]
- [Feedback point 3]
"""
        return prompt
    
    def _build_language_prompt(self, text: str) -> str:
        """Build prompt for language & style evaluation"""
        prompt = """
You are a resume language expert. Evaluate the resume's language and style based on:
- Use of active, precise language
- Grammar and spelling
- Consistency in tense and tone
- Professional vocabulary

Resume text:
"""
        prompt += f"\n{text[:1500]}...\n\n"  # Truncate text to avoid token limits
        
        prompt += """
Rate the language and style on a scale from 0-100, where:
0-20: Poor (frequent errors, passive voice, vague language)
21-40: Below Average (noticeable issues affecting readability)
41-60: Average (generally correct but not impactful)
61-80: Good (clear, active language with minor issues)
81-100: Excellent (polished, precise, professional)

Provide 3-5 specific, actionable feedback points for improvement.

Your response must be in this format:
Score: [0-100]
Feedback:
- [Feedback point 1]
- [Feedback point 2]
- [Feedback point 3]
"""
        return prompt
    
    def _build_outcome_prompt(self, experience_text: str) -> str:
        """Build prompt for outcome orientation evaluation"""
        prompt = """
You are a resume impact expert. Evaluate the resume's outcome orientation based on:
- Focus on quantifiable achievements (metrics, KPIs, percentages)
- Clear demonstration of impact and responsibilities
- Result-oriented language
- Evidence of contributions to business goals

Experience section:
"""
        prompt += f"\n{experience_text[:1500]}...\n\n"  # Truncate text to avoid token limits
        
        prompt += """
Rate the outcome orientation on a scale from 0-100, where:
0-20: Poor (no achievements, vague descriptions of duties)
21-40: Below Average (minimal results, mostly task-focused)
41-60: Average (some achievements but lacking metrics)
61-80: Good (clear accomplishments with some quantification)
81-100: Excellent (strong metrics, clear impact demonstration)

Provide 3-5 specific, actionable feedback points for improvement.

Your response must be in this format:
Score: [0-100]
Feedback:
- [Feedback point 1]
- [Feedback point 2]
- [Feedback point 3]
"""
        return prompt
    
    def _llm_call(self, prompt: str) -> str:
        """
        Send a prompt to the Ollama LLM via litellm.
        
        Args:
            prompt: Prompt to send to the LLM
            
        Returns:
            LLM response text
        """
        resp = completion(
            model="ollama/llama3.2",
            api_base="http://ollama:11434",
            messages=[{"role": "user", "content": prompt}]
        )
        return resp.choices[0].message.content.strip()
    
    def _extract_score(self, response: str) -> int:
        """Extract numerical score from LLM response"""
        score_match = re.search(r"Score:\s*(\d+)", response)
        if score_match:
            score = int(score_match.group(1))
            return max(0, min(100, score))  # Clamp between 0-100
        return 50  # Default to middle score if parsing fails
    
    def _extract_feedback(self, response: str) -> List[str]:
        """Extract feedback points from LLM response"""
        # Find the feedback section
        feedback_section = response.split("Feedback:", 1)[-1].strip()
        
        # Extract bullet points
        feedback_points = []
        for line in feedback_section.split("\n"):
            line = line.strip()
            if line.startswith("- "):
                point = line[2:].strip()
                if point:
                    feedback_points.append(point)
        
        # If no points found with bullet format, try to split by numbers
        if not feedback_points:
            feedback_points = [line.strip() for line in re.split(r"\d+\.", feedback_section) if line.strip()]
        
        # Limit to 5 points
        return feedback_points[:5]
