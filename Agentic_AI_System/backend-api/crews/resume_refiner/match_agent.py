import re
from typing import Dict, List, Any, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from litellm import completion

class MatchAgent:
    """
    Agent responsible for matching resumes to job descriptions using semantic similarity.
    Uses sentence transformers for basic matching and Llama for sophisticated analysis.
    """
    
    # Model to use for embeddings
    MODEL_NAME = "all-MiniLM-L6-v2"
    
    def __init__(self):
        """Initialize the sentence transformer model"""
        try:
            self.model = SentenceTransformer(self.MODEL_NAME)
            self.use_transformer = True
        except Exception as e:
            print(f"Warning: Could not load SentenceTransformer model: {e}")
            print("Falling back to LLM-only matching")
            self.use_transformer = False
    
    def match_jobs(self, resume_data: Dict[str, Any], job_descriptions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Match a resume against multiple job descriptions.
        
        Args:
            resume_data: Dictionary with parsed resume text and sections
            job_descriptions: List of job description dictionaries
            
        Returns:
            List of job matches with similarity scores and highlighted matches
        """
        # Extract resume text
        resume_text = self._prepare_resume_text(resume_data)
        
        # Process each job
        results = []
        for job in job_descriptions:
            match_result = self.match_single_job(resume_text, job)
            results.append(match_result)
            
        # Sort by overall match score
        results.sort(key=lambda x: x["overall_score"], reverse=True)
        
        return results
    
    def match_single_job(self, resume_text: str, job: Dict[str, Any]) -> Dict[str, Any]:
        """
        Match a resume against a single job description with improved matching.
        Uses both semantic similarity and LLM analysis for comprehensive evaluation.
        
        Args:
            resume_text: Processed resume text
            job: Job description dictionary
            
        Returns:
            Dictionary with match results
        """
        # Extract job details
        job_id = job.get("job_id", "unknown")
        job_title = job.get("job_title", "Unknown Position")
        job_text = job.get("description", "")
        
        # Calculate overall similarity score
        if self.use_transformer:
            transformer_score = self._calculate_similarity(resume_text, job_text)
        else:
            transformer_score = 0
        
        # Extract skills from resume and job
        resume_skills = self._extract_skills(resume_text)
        job_skills = self._extract_skills(job_text)
        
        # Match skills
        matching_skills, missing_skills, skill_match_percentage = self._match_skills(resume_skills, job_skills)
        
        # Generate a brief job summary
        job_summary = self._generate_job_summary(job_text)
        
        # Use LLM for sophisticated analysis
        llm_analysis = self._analyze_with_llm(resume_text, job_text, job_title)
        
        # Combine transformer score with LLM score if available
        if llm_analysis and "match_score" in llm_analysis:
            # Weight: 40% transformer, 60% LLM
            if self.use_transformer:
                overall_score = 0.4 * transformer_score + 0.6 * llm_analysis["match_score"]
            else:
                overall_score = llm_analysis["match_score"]
        else:
            overall_score = transformer_score
        
        # Use LLM-generated suggestions if available, otherwise fall back to rule-based
        if llm_analysis and "improvement_suggestions" in llm_analysis:
            improvement_suggestions = llm_analysis["improvement_suggestions"]
        else:
            improvement_suggestions = self._generate_improvement_suggestions(
                resume_text, job_text, matching_skills, missing_skills
            )
        
        # Use LLM-identified missing skills if available
        if llm_analysis and "missing_skills" in llm_analysis and llm_analysis["missing_skills"]:
            # Combine both sources of missing skills, with LLM skills first
            combined_missing = llm_analysis["missing_skills"] + [s for s in missing_skills if s not in llm_analysis["missing_skills"]]
            missing_skills = combined_missing[:15]  # Limit to 15 skills
        
        # Calculate skill match percentage
        skill_match_pct = 0
        if job_skills:
            skill_match_pct = round(len(matching_skills) / len(job_skills) * 100)
        
        # Prepare result
        result = {
            "job_id": job_id,
            "job_title": job_title,
            "overall_score": round(float(overall_score) * 100),  # Convert to percentage
            "skill_match_percentage": skill_match_pct,
            "matching_skills": matching_skills[:15],  # Increased limit
            "missing_skills": missing_skills[:10],    # Increased limit
            "improvement_suggestions": improvement_suggestions[:5],  # New field
            "job_summary": job_summary
        }
        
        return result
    
    def _prepare_resume_text(self, resume_data: Dict[str, Any]) -> str:
        """
        Extract and prepare resume text for matching.
        Prioritizes certain sections and formats text.
        """
        sections = resume_data.get("sections", {})
        
        # Prioritize these sections
        priority_sections = ["profile", "skills", "experience"]
        
        # Build combined text with section headers
        combined_text = ""
        
        # Add priority sections first
        for section in priority_sections:
            if section in sections and sections[section]:
                combined_text += f"{section.upper()}:\n{sections[section]}\n\n"
        
        # Add other sections
        for section, content in sections.items():
            if section not in priority_sections and content:
                combined_text += f"{section.upper()}:\n{content}\n\n"
        
        # If no sections found, use full text
        if not combined_text and "full_text" in resume_data:
            combined_text = resume_data["full_text"]
            
        return combined_text
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity between two texts using sentence transformers.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        # Handle empty texts
        if not text1 or not text2:
            return 0.0
            
        # Create embeddings
        embedding1 = self.model.encode(text1, convert_to_tensor=True)
        embedding2 = self.model.encode(text2, convert_to_tensor=True)
        
        # Calculate cosine similarity
        similarity = embedding1 @ embedding2.T / (
            np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
        )
        
        return float(similarity)
    
    def _extract_skills(self, text: str) -> List[str]:
        """
        Extract potential skills from text using more comprehensive patterns.
        
        Args:
            text: Text to extract skills from
            
        Returns:
            List of potential skills
        """
        # Common technical skills pattern
        tech_pattern = r'\b(?:Python|Java|JavaScript|TypeScript|React|Angular|Vue|Node\.js|Express|Django|Flask|SQL|MySQL|PostgreSQL|MongoDB|Redis|AWS|Azure|GCP|Docker|Kubernetes|CI/CD|Git|GitHub|REST|API|JSON|XML|HTML|CSS|SASS|LESS|Bootstrap|Tailwind|Redux|GraphQL|Webpack|Babel|Jest|Mocha|Cypress|Selenium|TDD|Agile|Scrum|Kanban|DevOps|Machine Learning|AI|NLP|Computer Vision|Data Science|Big Data|Hadoop|Spark|TensorFlow|PyTorch|Keras|scikit-learn|pandas|NumPy|R|Tableau|Power BI|Excel|VBA|C\+\+|C#|Ruby|PHP|Go|Rust|Swift|Kotlin|Objective-C|Unity|Unreal|Photoshop|Illustrator|Figma|Sketch|InDesign|After Effects|Premiere Pro|Final Cut|Logic Pro|Ableton|Pro Tools|Maya|Blender|3D Studio Max|ZBrush|AutoCAD|Revit|SketchUp)\b'
        
        # Common soft skills pattern
        soft_pattern = r'\b(?:Leadership|Communication|Teamwork|Problem[- ]Solving|Critical Thinking|Decision[- ]Making|Time Management|Project Management|Adaptability|Flexibility|Creativity|Innovation|Collaboration|Interpersonal|Presentation|Negotiation|Conflict Resolution|Emotional Intelligence|Customer Service|Client Relations|Strategic Planning|Analytical|Research|Organization|Detail[- ]Oriented|Multitasking|Self[- ]Motivated|Results[- ]Driven|Goal[- ]Oriented)\b'
        
        # Common tools pattern
        tools_pattern = r'\b(?:Microsoft Office|Word|Excel|PowerPoint|Outlook|Google Workspace|Docs|Sheets|Slides|Gmail|Slack|Teams|Zoom|Skype|Jira|Confluence|Trello|Asana|Monday|Notion|Airtable|Salesforce|HubSpot|Zendesk|ServiceNow|SAP|Oracle|QuickBooks|Adobe Creative Cloud|Photoshop|Illustrator|InDesign|Premiere|After Effects|Figma|Sketch|XD|Canva|WordPress|Shopify|Wix|Squarespace|Mailchimp|Constant Contact|Google Analytics|SEO|SEM|Social Media|Facebook|Instagram|Twitter|LinkedIn|TikTok|YouTube|Google Ads|Facebook Ads)\b'
        
        # Extract all matches
        tech_skills = re.findall(tech_pattern, text, re.IGNORECASE)
        soft_skills = re.findall(soft_pattern, text, re.IGNORECASE)
        tool_skills = re.findall(tools_pattern, text, re.IGNORECASE)
        
        # Combine all skills and normalize case
        all_skills = [skill.lower() for skill in tech_skills + soft_skills + tool_skills]
        
        # Extract additional potential skills (capitalized terms that might be technologies or methodologies)
        # Look for terms that are capitalized or all caps and might be skills
        potential_skills = re.findall(r'\b[A-Z][a-zA-Z0-9]*(?:[- ][A-Z][a-zA-Z0-9]*)*\b|\b[A-Z]{2,}\b', text)
        
        # Filter out common non-skill capitalized words
        non_skills = {'I', 'A', 'The', 'My', 'Your', 'Our', 'Their', 'We', 'You', 'He', 'She', 'It', 'They', 'This', 'That', 'These', 'Those', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'}
        filtered_potential = [skill for skill in potential_skills if skill not in non_skills and len(skill) > 1]
        
        # Add filtered potential skills
        all_skills.extend([skill.lower() for skill in filtered_potential])
        
        # Remove duplicates while preserving order
        unique_skills = []
        seen = set()
        for skill in all_skills:
            if skill not in seen:
                seen.add(skill)
                unique_skills.append(skill)
        
        return unique_skills
        
    def _match_skills(self, resume_skills: List[str], job_skills: List[str]) -> Tuple[List[str], List[str], float]:
        """
        Match skills from resume against skills required in job description.
        
        Args:
            resume_skills: List of skills extracted from resume
            job_skills: List of skills extracted from job description
            
        Returns:
            Tuple containing:
            - List of matching skills
            - List of missing skills (in job but not in resume)
            - Percentage of job skills matched
        """
        # Convert to sets for easier matching
        resume_skill_set = set(skill.lower() for skill in resume_skills)
        job_skill_set = set(skill.lower() for skill in job_skills)
        
        # Find exact matches
        exact_matches = resume_skill_set.intersection(job_skill_set)
        
        # Find fuzzy matches for skills that didn't match exactly
        fuzzy_matches = set()
        missing_skills = set()
        
        for job_skill in job_skill_set:
            if job_skill in exact_matches:
                continue
                
            # Check if job skill is a substring of any resume skill
            found_match = False
            for resume_skill in resume_skill_set:
                # Check for partial matches (one is substring of the other)
                if job_skill in resume_skill or resume_skill in job_skill:
                    fuzzy_matches.add(job_skill)
                    found_match = True
                    break
                    
                # Check for similar skills with slight variations (e.g., "React" vs "ReactJS")
                # Remove common suffixes/prefixes and compare
                job_skill_base = re.sub(r'(\.js|js|\.net|framework|library|\d+(\.\d+)*)', '', job_skill).strip()
                resume_skill_base = re.sub(r'(\.js|js|\.net|framework|library|\d+(\.\d+)*)', '', resume_skill).strip()
                
                if (job_skill_base and resume_skill_base and 
                    (job_skill_base in resume_skill_base or resume_skill_base in job_skill_base)):
                    fuzzy_matches.add(job_skill)
                    found_match = True
                    break
                    
            if not found_match:
                missing_skills.add(job_skill)
        
        # Combine exact and fuzzy matches
        all_matches = list(exact_matches.union(fuzzy_matches))
        missing_skills_list = list(missing_skills)
        
        # Calculate match percentage
        if not job_skill_set:
            match_percentage = 0.0
        else:
            match_percentage = len(all_matches) / len(job_skill_set) * 100
            
        return all_matches, missing_skills_list, match_percentage
        
    def _generate_job_summary(self, job_text: str) -> str:
        """
        Generate a brief summary of the job description.
        
        Args:
            job_text: Full job description text
            
        Returns:
            Brief summary (first few sentences)
        """
        # Simple approach: take first 200 characters
        if len(job_text) <= 200:
            return job_text
        
        # Try to find a good breakpoint
        breakpoint = job_text[:200].rfind('.')
        if breakpoint == -1:
            breakpoint = job_text[:200].rfind('\n')
        if breakpoint == -1:
            breakpoint = 200
            
        return job_text[:breakpoint+1].strip()
    
    def _analyze_with_llm(self, resume_text: str, job_text: str, job_title: str) -> Dict[str, Any]:
        """
        Use Llama to perform a sophisticated analysis of the resume against the job description.
        This provides a more holistic evaluation that considers both explicit skills and implicit requirements.
        
        Args:
            resume_text: The resume text
            job_text: The job description text
            job_title: The job title
            
        Returns:
            Dictionary with LLM analysis results including match score, missing skills, and improvement suggestions
        """
        try:
            # Prepare a prompt for the LLM
            prompt = f"""You are an expert career advisor and recruiter with deep knowledge of what makes a resume stand out for specific job roles.

I need you to analyze a resume against a job description and provide a comprehensive evaluation.

### JOB DESCRIPTION:
Title: {job_title}

{job_text}

### RESUME:
{resume_text}

### INSTRUCTIONS:
Analyze how well this resume matches the job description by considering:

1. Hard skills match (technical skills, tools, languages, etc.)
2. Soft skills match (communication, teamwork, leadership, etc.)
3. Experience relevance (similar roles, industry knowledge)
4. Education and certifications
5. Achievement alignment with job requirements

Provide your analysis in the following JSON format:
{{"match_score": <float between 0 and 1>,
"missing_skills": [<list of specific skills/qualifications missing from the resume>],
"improvement_suggestions": [<list of 3-5 specific, actionable suggestions to improve the resume for this job>]}}

The match_score should reflect how well the candidate's profile fits the job requirements overall.
The missing_skills should identify specific technical and soft skills mentioned in the job that aren't evident in the resume.
The improvement_suggestions should be specific, actionable ways to improve the resume for this particular job.

Provide ONLY the JSON response with no additional text."""

            # Call the LLM
            response = self._llm_call(prompt)
            
            # Parse the response
            # First, try to extract JSON from the response (in case there's additional text)
            import json
            import re
            
            # Look for JSON pattern
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                json_str = json_match.group(0)
                try:
                    result = json.loads(json_str)
                    return result
                except json.JSONDecodeError:
                    print("Warning: Could not parse LLM response as JSON")
            
            # If we couldn't parse JSON, return empty dict
            return {}
            
        except Exception as e:
            print(f"Error in LLM analysis: {e}")
            return {}
    
    def _llm_call(self, prompt: str) -> str:
        """
        Send a prompt to the Ollama LLM via litellm.
        
        Args:
            prompt: Prompt to send to the LLM
            
        Returns:
            LLM response text
        """
        try:
            resp = completion(
                model="ollama/llama3.2",
                api_base="http://host.docker.internal:11434",
                messages=[{"role": "user", "content": prompt}]
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"LLM call failed: {e}")
            return ""
            
    def _generate_improvement_suggestions(self, resume_text: str, job_text: str, 
                                         matching_skills: List[str], 
                                         missing_skills: List[str]) -> List[str]:
        """
        Generate actionable suggestions to improve resume match.
        
        Args:
            resume_text: Resume text
            job_text: Job description text
            matching_skills: List of matching skills
            missing_skills: List of missing skills
            
        Returns:
            List of improvement suggestions
        """
        suggestions = []
        
        # Suggest adding missing skills
        if missing_skills:
            top_missing = missing_skills[:3]
            suggestions.append(f"Add these key skills to your resume: {', '.join(top_missing)}")
        
        # Suggest highlighting matching skills more prominently
        if matching_skills:
            suggestions.append("Highlight your existing relevant skills more prominently at the top of your resume")
        
        # Check for experience section
        if "experience" in resume_text.lower():
            suggestions.append("Quantify your achievements with metrics and numbers to demonstrate impact")
            
        # Check for education section
        if "education" in resume_text.lower() and any(term in job_text.lower() for term in ["degree", "bachelor", "master", "phd"]):
            suggestions.append("Ensure your education section highlights relevant coursework and projects")
            
        # Check for project section
        if not "project" in resume_text.lower() and "project" in job_text.lower():
            suggestions.append("Add a projects section showcasing work related to this position")
            
        # Check for job-specific keywords
        job_keywords = self._extract_job_keywords(job_text)
        if job_keywords:
            suggestions.append(f"Incorporate these job-specific terms: {', '.join(job_keywords[:3])}")
            
        # Add general suggestions if we don't have enough
        if len(suggestions) < 3:
            suggestions.append("Tailor your resume summary/objective specifically to this position")
            suggestions.append("Use action verbs that match the language in the job description")
            
        return suggestions
        
    def _extract_job_keywords(self, job_text: str) -> List[str]:
        """
        Extract important keywords from job description that aren't in the skills list.
        
        Args:
            job_text: Job description text
            
        Returns:
            List of important job keywords
        """
        # Look for emphasized terms (often in requirements or qualifications sections)
        keywords = []
        
        # Look for requirements section
        req_section = re.search(r"(?:Requirements|Qualifications|What You'll Need):(.*?)(?:\n\n|\Z)", 
                              job_text, re.IGNORECASE | re.DOTALL)
        
        if req_section:
            # Extract bullet points
            bullet_points = re.findall(r'[-•]\s*(.*?)(?:\n|$)', req_section.group(1))
            for point in bullet_points:
                # Extract key terms that might be emphasized
                terms = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b|\b[A-Z]{2,}\b', point)
                keywords.extend([term for term in terms if len(term) > 3])  # Filter out short terms
        
        # Remove duplicates
        unique_keywords = list(set(keywords))
        
        return unique_keywords
