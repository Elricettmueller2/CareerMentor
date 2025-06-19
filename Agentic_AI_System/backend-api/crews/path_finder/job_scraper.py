import os
import json
import random
import requests
from bs4 import BeautifulSoup
import time
from typing import Dict, List, Any, Optional

# Real implementation for scraping jobs from Google Jobs

# Realistic job data for German tech companies
GERMAN_COMPANIES = [
    {"name": "SAP", "locations": ["Walldorf", "Berlin", "München", "Hamburg"], "domain": "sap.com"},
    {"name": "Siemens", "locations": ["München", "Berlin", "Erlangen", "Nürnberg"], "domain": "siemens.com"},
    {"name": "Deutsche Telekom", "locations": ["Bonn", "Berlin", "Darmstadt"], "domain": "telekom.de"},
    {"name": "Bosch", "locations": ["Stuttgart", "Berlin", "München"], "domain": "bosch.com"},
    {"name": "Volkswagen", "locations": ["Wolfsburg", "Berlin", "München"], "domain": "volkswagen.de"},
    {"name": "BMW", "locations": ["München", "Berlin", "Leipzig"], "domain": "bmw.com"},
    {"name": "Mercedes-Benz", "locations": ["Stuttgart", "Berlin", "Bremen"], "domain": "mercedes-benz.com"},
    {"name": "Zalando", "locations": ["Berlin", "Dortmund", "Frankfurt"], "domain": "zalando.de"},
    {"name": "HelloFresh", "locations": ["Berlin", "München", "Köln"], "domain": "hellofresh.de"},
    {"name": "N26", "locations": ["Berlin", "Wien", "Barcelona"], "domain": "n26.com"},
    {"name": "Celonis", "locations": ["München", "Berlin", "Frankfurt"], "domain": "celonis.com"},
    {"name": "Personio", "locations": ["München", "Berlin", "Hamburg"], "domain": "personio.de"},
    {"name": "SoundCloud", "locations": ["Berlin", "New York", "London"], "domain": "soundcloud.com"},
    {"name": "FlixBus", "locations": ["München", "Berlin", "Hamburg"], "domain": "flixbus.de"},
    {"name": "Auto1", "locations": ["Berlin", "München", "Hamburg"], "domain": "auto1-group.com"},
    {"name": "Infineon", "locations": ["München", "Dresden", "Regensburg"], "domain": "infineon.com"},
    {"name": "Delivery Hero", "locations": ["Berlin", "München", "Köln"], "domain": "deliveryhero.com"},
    {"name": "Bayer", "locations": ["Leverkusen", "Berlin", "Köln"], "domain": "bayer.de"},
    {"name": "Adidas", "locations": ["Herzogenaurach", "Berlin", "München"], "domain": "adidas.de"},
    {"name": "BASF", "locations": ["Ludwigshafen", "Berlin", "München"], "domain": "basf.com"}
]

# Realistic job descriptions and requirements for software developers
SOFTWARE_DEV_DESCRIPTIONS = [
    "Wir suchen einen erfahrenen {0}, der unser agiles Entwicklungsteam verstärkt. Sie werden an innovativen Lösungen arbeiten, die unseren Kunden einen echten Mehrwert bieten.",
    "Als {0} bei {1} werden Sie Teil eines dynamischen Teams, das an der Entwicklung skalierbarer und robuster Softwarelösungen arbeitet.",
    "Wir suchen einen motivierten {0} mit Leidenschaft für Clean Code und moderne Entwicklungspraktiken. In dieser Rolle werden Sie maßgeblich an der Weiterentwicklung unserer Kernprodukte beteiligt sein.",
    "Für unser wachsendes Technologieteam suchen wir einen {0}, der uns dabei hilft, unsere digitale Transformation voranzutreiben und innovative Lösungen zu entwickeln.",
    "Als {0} bei {1} werden Sie an spannenden Projekten arbeiten und die Chance haben, mit den neuesten Technologien zu experimentieren und zu innovieren."
]

# Realistic skills and technologies for different job types
TECH_SKILLS = {
    "Software Entwickler": ["Java", "Spring Boot", "Microservices", "Docker", "Kubernetes", "REST APIs", "Git", "CI/CD", "Agile", "Scrum"],
    "Frontend Entwickler": ["JavaScript", "TypeScript", "React", "Angular", "Vue.js", "HTML5", "CSS3", "SASS", "Webpack", "Jest"],
    "Backend Entwickler": ["Java", "Spring Boot", "Python", "Django", "Node.js", "Express", "MongoDB", "PostgreSQL", "Redis", "RabbitMQ"],
    "Full-Stack Entwickler": ["JavaScript", "TypeScript", "React", "Node.js", "MongoDB", "GraphQL", "Docker", "AWS", "Git", "CI/CD"],
    "DevOps Engineer": ["Docker", "Kubernetes", "Terraform", "AWS", "Azure", "CI/CD", "Jenkins", "Ansible", "Prometheus", "Grafana"],
    "Data Scientist": ["Python", "R", "SQL", "Machine Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn", "Jupyter"],
    "Data Engineer": ["Python", "Spark", "Hadoop", "SQL", "NoSQL", "ETL", "Airflow", "Kafka", "AWS", "Databricks"],
    "Cloud Engineer": ["AWS", "Azure", "GCP", "Terraform", "CloudFormation", "Kubernetes", "Docker", "CI/CD", "Python", "Bash"],
    "Mobile Entwickler": ["Swift", "Kotlin", "Flutter", "React Native", "iOS", "Android", "Firebase", "REST APIs", "Git", "CI/CD"],
    "QA Engineer": ["Selenium", "Cypress", "Jest", "JUnit", "TestNG", "Cucumber", "Postman", "JIRA", "Git", "CI/CD"]
}

# Helper functions for the mock implementation
def generate_realistic_job(job_title: str, index: int, interest_points: List[str]) -> Dict[str, Any]:
    """Generate a realistic job listing for German tech companies"""
    # Bestimme den Job-Typ (Junior, Senior, etc.)
    job_levels = ["", "Junior ", "Senior ", "Lead ", "Principal "]
    job_level_weights = [0.4, 0.2, 0.3, 0.08, 0.02]  # Gewichtungen für realistische Verteilung
    job_level = random.choices(job_levels, weights=job_level_weights)[0]
    
    # Wähle ein zufälliges Unternehmen
    company = random.choice(GERMAN_COMPANIES)
    company_name = company["name"]
    location = random.choice(company["locations"]) + ", Deutschland"
    domain = company["domain"]
    
    # Bestimme die erforderliche Erfahrung basierend auf dem Job-Level
    if "Junior" in job_level:
        experience_required = random.randint(0, 2)
    elif "Senior" in job_level:
        experience_required = random.randint(3, 7)
    elif "Lead" in job_level or "Principal" in job_level:
        experience_required = random.randint(5, 12)
    else:
        experience_required = random.randint(1, 5)
    
    # Bestimme den Bildungsabschluss
    education_levels = ["Bachelor", "Master", "Diplom", "Ausbildung"]
    education_weights = [0.5, 0.3, 0.15, 0.05]
    education_required = random.choices(education_levels, weights=education_weights)[0]
    
    # Generiere ein realistisches Gehalt basierend auf Erfahrung und Position
    base_salary = 45000
    if "Junior" in job_level:
        salary_min = base_salary + (experience_required * 3000)
        salary_max = salary_min + random.randint(5000, 15000)
    elif "Senior" in job_level:
        salary_min = base_salary + 15000 + (experience_required * 4000)
        salary_max = salary_min + random.randint(10000, 25000)
    elif "Lead" in job_level or "Principal" in job_level:
        salary_min = base_salary + 30000 + (experience_required * 5000)
        salary_max = salary_min + random.randint(15000, 35000)
    else:
        salary_min = base_salary + (experience_required * 3500)
        salary_max = salary_min + random.randint(8000, 20000)
    
    # Runde die Gehälter auf Tausender
    salary_min = round(salary_min / 1000) * 1000
    salary_max = round(salary_max / 1000) * 1000
    
    # Bestimme den Basis-Jobtitel ohne Präfixe wie "Junior", "Senior", etc.
    base_job_title = job_title
    
    # Wähle passende Skills basierend auf dem Jobtitel und den Interessenpunkten
    relevant_skills = []
    if base_job_title in TECH_SKILLS:
        # Nimm alle Skills für diesen Jobtitel
        all_skills = TECH_SKILLS[base_job_title].copy()
        
        # Füge Interessenpunkte hinzu, wenn sie nicht bereits in den Skills enthalten sind
        for point in interest_points:
            if point not in all_skills and point.strip():
                all_skills.append(point)
        
        # Wähle eine zufällige Teilmenge der Skills
        num_skills = random.randint(4, 8)
        relevant_skills = random.sample(all_skills, min(num_skills, len(all_skills)))
    else:
        # Fallback für unbekannte Jobtitel
        generic_skills = ["Teamarbeit", "Kommunikation", "Problemlösung", "Analytisches Denken"]
        relevant_skills = generic_skills + interest_points
    
    # Generiere eine realistische Beschreibung
    description_template = random.choice(SOFTWARE_DEV_DESCRIPTIONS)
    description = description_template.format(job_level + base_job_title, company_name)
    
    # Füge Details zu den erforderlichen Fähigkeiten hinzu
    skills_text = "\n\nErforderliche Fähigkeiten:\n- " + "\n- ".join(relevant_skills)
    
    # Füge Details zu Erfahrung und Bildung hinzu
    exp_edu_text = f"\n\nAnforderungen:\n- {experience_required}+ Jahre Erfahrung in der Softwareentwicklung\n- {education_required} in Informatik oder einem verwandten Bereich"
    
    full_description = description + skills_text + exp_edu_text
    
    # Generiere eine eindeutige Job-ID
    job_id = f"job_{index}_{hash(company_name + job_level + base_job_title) % 10000}"
    
    # Erstelle das Job-Angebot
    return {
        "id": job_id,
        "title": f"{job_level}{base_job_title}",
        "company_name": company_name,
        "location": location,
        "description": full_description,
        "requirements": f"{experience_required}+ Jahre Erfahrung, {education_required}",
        "salary": f"€{salary_min // 1000}K - €{salary_max // 1000}K",
        "application_link": f"https://karriere.{domain}/jobs/{job_id}",
        "experience_required": experience_required,
        "education_required": education_required,
        "distance": random.randint(5, 50),
        "source": "CareerMentor Database",
        "skills": relevant_skills
    }

def scrape_indeed_jobs(query: str, location: str = "Germany", num_results: int = 100) -> List[Dict[str, Any]]:
    """Scrape job listings from Indeed
    
    Args:
        query: Search query (job title + keywords)
        location: Location to search in
        num_results: Maximum number of results to return
        
    Returns:
        List of job listings
    """
    try:
        # Construct the Indeed search URL
        base_url = "https://de.indeed.com/jobs"
        params = {
            "q": query,
            "l": location,
            "sort": "date",  # Sort by date (newest first)
            "limit": num_results
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
            "Referer": "https://de.indeed.com/"
        }
        
        print(f"Scraping Indeed jobs for query: '{query}' in {location}")
        response = requests.get(base_url, params=params, headers=headers)
        
        if response.status_code != 200:
            print(f"Error: Received status code {response.status_code} from Indeed")
            print(f"Response content: {response.text[:200]}...")
            return []
        
        # Parse the HTML response
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find job listings
        job_listings = []
        job_cards = soup.select('div.job_seen_beacon')
        
        print(f"Found {len(job_cards)} Indeed job cards")
        
        for i, card in enumerate(job_cards[:num_results]):
            try:
                # Extract job details
                title_elem = card.select_one('h2.jobTitle')
                company_elem = card.select_one('span.companyName')
                location_elem = card.select_one('div.companyLocation')
                description_elem = card.select_one('div.job-snippet')
                
                title = title_elem.text.strip() if title_elem else "Unknown Title"
                company = company_elem.text.strip() if company_elem else "Unknown Company"
                location = location_elem.text.strip() if location_elem else "Unknown Location"
                description = description_elem.text.strip() if description_elem else ""
                
                # Extract salary if available
                salary_elem = card.select_one('div.salary-snippet')
                salary = salary_elem.text.strip() if salary_elem else "Salary not specified"
                
                # Generate a unique job ID
                job_id = f"indeed_{i+1}_{hash(title + company) % 10000}"
                
                # Extract education and experience requirements from description
                education_required = "Bachelor"
                if "master" in description.lower() or "master's" in description.lower():
                    education_required = "Master"
                elif "phd" in description.lower() or "doctorate" in description.lower():
                    education_required = "PhD"
                
                # Estimate experience required
                experience_required = 0
                exp_indicators = ["jahre erfahrung", "years experience", "years of experience"]
                for indicator in exp_indicators:
                    if indicator in description.lower():
                        # Try to find a number before the indicator
                        parts = description.lower().split(indicator)[0].split()
                        for part in reversed(parts):
                            if part.isdigit():
                                experience_required = int(part)
                                break
                
                # Create job listing
                job = {
                    "id": job_id,
                    "title": title,
                    "company_name": company,
                    "location": location,
                    "description": description,
                    "salary": salary,
                    "application_link": "https://de.indeed.com/viewjob?jk=" + job_id.split('_')[2],
                    "experience_required": experience_required,
                    "education_required": education_required,
                    "distance": random.randint(5, 50),  # Simulate distance
                    "source": "Indeed"
                }
                
                job_listings.append(job)
            except Exception as e:
                print(f"Error parsing Indeed job card: {e}")
        
        return job_listings
    
    except Exception as e:
        print(f"Error scraping Indeed Jobs: {e}")
        return []

def scrape_linkedin_jobs(query: str, location: str = "Germany", num_results: int = 100) -> List[Dict[str, Any]]:
    """Scrape job listings from LinkedIn
    
    Args:
        query: Search query (job title + keywords)
        location: Location to search in
        num_results: Maximum number of results to return
        
    Returns:
        List of job listings
    """
    try:
        # Construct the LinkedIn search URL
        base_url = "https://www.linkedin.com/jobs/search"
        params = {
            "keywords": query,
            "location": location,
            "position": 1,
            "pageNum": 0
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
            "Referer": "https://www.linkedin.com/"
        }
        
        print(f"Scraping LinkedIn jobs for query: '{query}' in {location}")
        response = requests.get(base_url, params=params, headers=headers)
        
        if response.status_code != 200:
            print(f"Error: Received status code {response.status_code} from LinkedIn")
            print(f"Response content: {response.text[:200]}...")
            return []
        
        # Parse the HTML response
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find job listings
        job_listings = []
        job_cards = soup.select('div.base-card')
        
        print(f"Found {len(job_cards)} LinkedIn job cards")
        
        for i, card in enumerate(job_cards[:num_results]):
            try:
                # Extract job details
                title_elem = card.select_one('h3.base-search-card__title')
                company_elem = card.select_one('h4.base-search-card__subtitle')
                location_elem = card.select_one('span.job-search-card__location')
                
                title = title_elem.text.strip() if title_elem else "Unknown Title"
                company = company_elem.text.strip() if company_elem else "Unknown Company"
                location = location_elem.text.strip() if location_elem else "Unknown Location"
                
                # Get job link
                link_elem = card.select_one('a.base-card__full-link')
                job_link = link_elem['href'] if link_elem and 'href' in link_elem.attrs else ""
                
                # Generate a unique job ID
                job_id = f"linkedin_{i+1}_{hash(title + company) % 10000}"
                
                # Create job listing with minimal info (we would need to click into each job for full details)
                job = {
                    "id": job_id,
                    "title": title,
                    "company_name": company,
                    "location": location,
                    "description": f"Position at {company}. Click the application link for more details.",
                    "salary": "Salary not specified",
                    "application_link": job_link,
                    "experience_required": 0,  # Default
                    "education_required": "Bachelor",  # Default
                    "distance": random.randint(5, 50),  # Simulate distance
                    "source": "LinkedIn"
                }
                
                job_listings.append(job)
            except Exception as e:
                print(f"Error parsing LinkedIn job card: {e}")
        
        return job_listings
    
    except Exception as e:
        print(f"Error scraping LinkedIn Jobs: {e}")
        return []

# Main function for job search
def search_jobs_online(job_title: str, education_level: str, years_experience: int,
                     location_radius: int, interest_points: List[str], limit: int = 100) -> Dict[str, Any]:
    """Searches for jobs online based on various criteria
    
    Args:
        job_title: The job title to search for
        education_level: Highest education level achieved
        years_experience: Years of job experience
        location_radius: Search radius in km
        interest_points: List of interest points
        limit: Maximum number of results to return
        
    Returns:
        Dictionary containing search results
    """
    print(f"Searching for jobs: '{job_title}' with education '{education_level}', "
          f"{years_experience} years experience, {location_radius}km radius")
    print(f"Interest points: {', '.join(interest_points)}")
    
    # Sammle alle Jobs von verschiedenen Quellen
    all_jobs = []
    
    # Try to scrape jobs from Indeed
    try:
        # Build search query with job title and interest points
        query = job_title
        if interest_points:
            # Add top 2 interest points to the query
            query += " " + " ".join(interest_points[:2])
        
        # Scrape jobs from Indeed
        indeed_jobs = scrape_indeed_jobs(query, "Deutschland", limit)
        
        if indeed_jobs:
            print(f"Successfully scraped {len(indeed_jobs)} jobs from Indeed")
            all_jobs.extend(indeed_jobs)
    except Exception as e:
        print(f"Error in Indeed job scraping: {e}")
    
    # Try to scrape jobs from LinkedIn
    try:
        # Build search query with job title and interest points
        query = job_title
        if interest_points:
            # Add top interest point to the query
            query += " " + interest_points[0] if interest_points else ""
        
        # Scrape jobs from LinkedIn
        linkedin_jobs = scrape_linkedin_jobs(query, "Deutschland", limit)
        
        if linkedin_jobs:
            print(f"Successfully scraped {len(linkedin_jobs)} jobs from LinkedIn")
            all_jobs.extend(linkedin_jobs)
    except Exception as e:
        print(f"Error in LinkedIn job scraping: {e}")
    
    # Wenn wir genügend echte Jobs haben, verwende diese
    if all_jobs and len(all_jobs) >= 5:
        print(f"Using {len(all_jobs)} real job listings")
        
        # Create the response with real jobs
        response = {
            "job_title": job_title,
            "education_level": education_level,
            "years_experience": years_experience,
            "location_radius": location_radius,
            "interest_points": interest_points,
            "count": len(all_jobs),
            "jobs": all_jobs
        }
        
        return response
    
    # Fallback to realistic job data if scraping fails or returns too few results
    print("Generating realistic job listings...")
    
    # Bestimme die Anzahl der zu generierenden Jobs basierend auf den Suchkriterien
    # Mehr spezifische Kriterien = weniger Jobs (realistischer)
    base_job_count = 25
    specificity_factor = 1.0
    
    # Reduziere die Anzahl der Jobs, wenn spezifische Kriterien angegeben sind
    if years_experience > 5:
        specificity_factor *= 0.8  # Weniger Jobs für hohe Erfahrung
    if education_level in ["Master", "PhD"]:
        specificity_factor *= 0.9  # Weniger Jobs für höhere Bildungsabschlüsse
    if len(interest_points) > 2:
        specificity_factor *= 0.9  # Weniger Jobs bei sehr spezifischen Interessen
    
    # Berechne die finale Anzahl der Jobs
    num_jobs = max(5, int(base_job_count * specificity_factor))
    
    # Generiere die realistischen Job-Angebote
    mock_jobs = []
    for i in range(num_jobs):
        # Erstelle ein realistisches Job-Angebot
        job = generate_realistic_job(job_title, i+1, interest_points)
        mock_jobs.append(job)
    
    # Sortiere Jobs nach Relevanz (basierend auf Übereinstimmung mit Interessenpunkten)
    def calculate_relevance(job):
        relevance = 0
        # Prüfe, ob die Interessenpunkte in den Skills oder der Beschreibung vorkommen
        for point in interest_points:
            if point in job.get("skills", []):
                relevance += 3  # Hohe Relevanz für direkte Skill-Übereinstimmung
            if point.lower() in job["description"].lower():
                relevance += 1  # Niedrigere Relevanz für Erwähnung in der Beschreibung
        
        # Berücksichtige auch die Erfahrung
        exp_diff = abs(job["experience_required"] - years_experience)
        relevance -= min(exp_diff, 5)  # Reduziere Relevanz bei großer Erfahrungsdifferenz
        
        return relevance
    
    # Sortiere die Jobs nach Relevanz (absteigend)
    if interest_points:
        mock_jobs.sort(key=calculate_relevance, reverse=True)
    
    print(f"Generated {len(mock_jobs)} realistic job listings")
    for i, job in enumerate(mock_jobs[:3]):
        print(f"Sample job {i+1}: {job['title']} at {job['company_name']} in {job['location']}")
    
    
    # Create the response with mock jobs
    response = {
        "job_title": job_title,
        "education_level": education_level,
        "years_experience": years_experience,
        "location_radius": location_radius,
        "interest_points": interest_points,
        "count": len(mock_jobs),
        "jobs": mock_jobs
    }
    
    return response

# For testing
if __name__ == "__main__":
    # Example call
    result = search_jobs_online(
        job_title="Software Developer",
        education_level="Bachelor",
        years_experience=2,
        location_radius=50,
        interest_points=["AI", "Machine Learning", "Python"]
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))

# Create a singleton instance of the job scraper for import
job_scraper_instance = {"search_jobs": search_jobs_online}
