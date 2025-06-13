import json
import random
from typing import List, Dict, Any
from datetime import datetime, timedelta

class JobScraper:
    """
    A module that simulates job scraping from online sources.
    In a production environment, this would connect to real job boards APIs or use web scraping.
    """
    
    def __init__(self):
        # Sample companies for job generation
        self.companies = [
            "Google", "Microsoft", "Amazon", "Apple", "Meta", "IBM", "Intel", 
            "NVIDIA", "SAP", "Oracle", "Salesforce", "Adobe", "VMware", 
            "Siemens", "Bosch", "Deutsche Bank", "Allianz", "Volkswagen Group",
            "BMW", "Mercedes-Benz", "Adidas", "Puma", "Bayer", "BASF"
        ]
        
        # Sample locations for job generation
        self.locations = [
            "Berlin, Germany", "Munich, Germany", "Hamburg, Germany", 
            "Frankfurt, Germany", "Cologne, Germany", "Stuttgart, Germany",
            "Düsseldorf, Germany", "Remote", "Hybrid - Berlin", "Hybrid - Munich"
        ]
        
        # Sample skills by job category
        self.skill_sets = {
            "software developer": ["Python", "JavaScript", "Java", "Git", "Agile"],
            "data scientist": ["Python", "R", "SQL", "Machine Learning", "Statistics"],
            "product manager": ["Agile", "JIRA", "User Stories", "Roadmapping", "Stakeholder Management"],
            "ux designer": ["Figma", "Adobe XD", "User Research", "Wireframing", "Prototyping"],
            "marketing": ["Social Media", "Content Creation", "SEO", "Analytics", "Campaign Management"],
            "sales": ["CRM", "Negotiation", "Presentation", "Lead Generation", "Account Management"],
            "engineer": ["CAD", "Simulation", "Material Science", "Product Development", "Testing"],
            "finance": ["Financial Analysis", "Excel", "Accounting", "Reporting", "Forecasting"]
        }
        
    def suggest_search_terms(self, partial_query: str) -> List[str]:
        """Generate search suggestions based on partial input"""
        base_suggestions = [
            "Software Developer", "Data Scientist", "Product Manager", "UX Designer",
            "Marketing Specialist", "Sales Representative", "Project Manager",
            "Business Analyst", "DevOps Engineer", "Full Stack Developer",
            "Machine Learning Engineer", "Frontend Developer", "Backend Developer"
        ]
        
        # Filter suggestions that contain the partial query (case insensitive)
        matching = [s for s in base_suggestions if partial_query.lower() in s.lower()]
        
        # If no exact matches, return some default suggestions
        if not matching:
            return random.sample(base_suggestions, min(5, len(base_suggestions)))
        
        return matching[:5]  # Return up to 5 matching suggestions
    
    def search_jobs(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for jobs matching the query.
        In production, this would connect to real job APIs.
        """
        # Normalize query for matching
        query_lower = query.lower()
        
        # Determine which skill set to use based on query
        skill_category = None
        for category in self.skill_sets:
            if category in query_lower:
                skill_category = category
                break
        
        # Use a default category if no match
        if not skill_category:
            skill_category = random.choice(list(self.skill_sets.keys()))
        
        # Generate job listings
        jobs = []
        for _ in range(limit):
            company = random.choice(self.companies)
            location = random.choice(self.locations)
            
            # Generate posting date (between today and 30 days ago)
            days_ago = random.randint(0, 30)
            posting_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            
            # Select skills relevant to this job category
            skills = self.skill_sets[skill_category]
            required_skills = random.sample(skills, min(3, len(skills)))
            
            # Generate salary range
            min_salary = random.randint(40, 80) * 1000
            max_salary = min_salary + random.randint(10, 40) * 1000
            
            # Generate job ID
            job_id = f"JOB-{random.randint(100000, 999999)}"
            
            # Build job title based on query
            job_title = f"{query.title()}"
            if "senior" not in query_lower and "junior" not in query_lower:
                seniority = random.choice(["", "Junior ", "Senior ", "Lead "])
                job_title = f"{seniority}{job_title}"
            
            # Create job listing
            job = {
                "id": job_id,
                "title": job_title,
                "company": company,
                "location": location,
                "description": self._generate_job_description(query, skill_category),
                "requirements": self._generate_requirements(required_skills),
                "salary_range": f"€{min_salary:,} - €{max_salary:,} per year",
                "employment_type": random.choice(["Full-time", "Part-time", "Contract"]),
                "remote": "Remote" in location or "Hybrid" in location,
                "posted_date": posting_date,
                "application_url": f"https://example.com/jobs/{job_id}/apply",
                "skills": ", ".join(required_skills)
            }
            
            jobs.append(job)
        
        return jobs
    
    def _generate_job_description(self, query: str, category: str) -> str:
        """Generate a realistic job description"""
        company_missions = [
            "is on a mission to revolutionize the industry with cutting-edge technology",
            "is a leading provider of innovative solutions in the market",
            "prides itself on creating products that change how people work and live",
            "is at the forefront of technological advancement in its field"
        ]
        
        roles = [
            f"We are looking for a talented {query} to join our growing team.",
            f"Our team is seeking an experienced {query} to help us build the next generation of products.",
            f"We need a passionate {query} who can bring fresh ideas to our organization."
        ]
        
        responsibilities = [
            f"Develop and maintain high-quality software/products",
            f"Collaborate with cross-functional teams to define and implement innovative solutions",
            f"Participate in the entire application lifecycle, focusing on coding and debugging",
            f"Write clean, maintainable code with comprehensive documentation",
            f"Work with stakeholders to gather requirements and provide technical expertise"
        ]
        
        mission = random.choice(company_missions)
        role = random.choice(roles)
        selected_responsibilities = random.sample(responsibilities, 3)
        
        description = f"Our company {mission}. {role}\n\nResponsibilities:\n"
        for resp in selected_responsibilities:
            description += f"- {resp}\n"
            
        return description
    
    def _generate_requirements(self, skills: List[str]) -> str:
        """Generate job requirements based on skills"""
        education = [
            "Bachelor's degree in Computer Science, Engineering, or related field",
            "Master's degree in relevant field preferred",
            "Degree in related field or equivalent practical experience"
        ]
        
        experience = [
            "2+ years of professional experience in the field",
            "3-5 years of relevant industry experience",
            "Proven track record of successful projects"
        ]
        
        general = [
            "Excellent communication and teamwork skills",
            "Problem-solving attitude with attention to detail",
            "Ability to work independently and manage priorities"
        ]
        
        requirements = f"Requirements:\n- {random.choice(education)}\n- {random.choice(experience)}\n"
        
        # Add skill requirements
        for skill in skills:
            requirements += f"- Experience with {skill}\n"
            
        # Add a general requirement
        requirements += f"- {random.choice(general)}\n"
        
        return requirements

    def get_job_details(self, job_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific job.
        In a real implementation, this would fetch from a database or API.
        """
        # Since we're simulating, we'll generate a random job with the given ID
        # In production, this would look up the job by ID in a database
        
        # For simulation, we'll just return a job with this ID
        job = self.search_jobs("Software Developer", 1)[0]  # Generate a sample job
        job["id"] = job_id  # Set the requested ID
        
        # Add some additional detail fields that might be present in a full view
        job["company_description"] = "This is a leading company in its industry with a global presence."
        job["benefits"] = [
            "Health insurance",
            "Retirement plan",
            "Flexible working hours",
            "Professional development opportunities",
            "Modern office environment"
        ]
        
        return job


# Singleton instance for use in the application
job_scraper = JobScraper()

# Example usage
if __name__ == "__main__":
    # Test search suggestions
    print("Search suggestions for 'dev':")
    print(job_scraper.suggest_search_terms("dev"))
    
    # Test job search
    print("\nJobs for 'Software Developer':")
    jobs = job_scraper.search_jobs("Software Developer", 2)
    print(json.dumps(jobs, indent=2))
    
    # Test job detail
    print("\nDetail for job ID:")
    detail = job_scraper.get_job_details("JOB-123456")
    print(json.dumps(detail, indent=2))
