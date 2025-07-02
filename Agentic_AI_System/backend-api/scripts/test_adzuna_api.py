import os
import requests
import json
from dotenv import load_dotenv

# Lade Umgebungsvariablen aus .env-Datei
load_dotenv()

def test_adzuna_api():
    """Test die Adzuna API-Verbindung und zeige die Antwort an"""
    
    # API-Anmeldedaten aus Umgebungsvariablen holen
    app_id = os.environ.get("ADZUNA_APP_ID")
    api_key = os.environ.get("ADZUNA_API_KEY")
    
    if not app_id or not api_key:
        print("Fehler: Adzuna API-Anmeldedaten nicht gefunden!")
        print("Bitte setze die ADZUNA_APP_ID und ADZUNA_API_KEY Umgebungsvariablen")
        return False
    
    print(f"API-Anmeldedaten gefunden:")
    print(f"  - APP_ID: {app_id[:4]}...{app_id[-4:] if len(app_id) > 8 else ''}")
    print(f"  - API_KEY: {api_key[:4]}...{api_key[-4:] if len(api_key) > 8 else ''}")
    
    # Teste verschiedene Suchbegriffe
    search_terms = ["Software Developer", "Data Scientist", "Project Manager"]
    
    for term in search_terms:
        print(f"\n{'=' * 50}")
        print(f"SUCHE NACH: {term}")
        print(f"{'=' * 50}")
        
        # Einfache Testabfrage
        base_url = "https://api.adzuna.com/v1/api/jobs/de/search/1"
        params = {
            "app_id": app_id,
            "app_key": api_key,
            "results_per_page": 10,
            "what": term,
            "content-type": "application/json"
        }
        
        print(f"Sende Testabfrage an Adzuna API...")
        try:
            response = requests.get(base_url, params=params)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Anzahl der gefundenen Jobs
                count = data.get("count", 0)
                print(f"Gefundene Jobs: {count}")
                
                # Zeige die ersten 3 Jobs an (falls vorhanden)
                results = data.get("results", [])
                print(f"Erste {min(3, len(results))} Jobs:")
                
                for i, job in enumerate(results[:3]):
                    print(f"\nJob {i+1}:")
                    print(f"  - Titel: {job.get('title', 'N/A')}")
                    print(f"  - Unternehmen: {job.get('company', {}).get('display_name', 'N/A')}")
                    print(f"  - Ort: {job.get('location', {}).get('display_name', 'N/A')}")
            else:
                print(f"Fehler: {response.status_code}")
                print(f"Antwort: {response.text}")
                return False
                
        except Exception as e:
            print(f"Fehler bei der API-Anfrage: {e}")
            return False
    
    return True

if __name__ == "__main__":
    success = test_adzuna_api()
    if success:
        print("\nAdzuna API funktioniert korrekt!")
    else:
        print("\nFehler bei der Adzuna API-Verbindung. Bitte überprüfe deine Anmeldedaten und Internetverbindung.")
