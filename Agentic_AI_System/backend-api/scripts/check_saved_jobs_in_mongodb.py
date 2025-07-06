#!/usr/bin/env python3
"""
Skript zum Überprüfen, ob Jobs korrekt in MongoDB gespeichert werden.
Dieses Skript stellt eine direkte Verbindung zur MongoDB her und prüft,
ob Jobs für einen bestimmten Benutzer vorhanden sind.
"""

import pymongo
import json
import sys
from pprint import pprint

# MongoDB-Verbindungsinformationen
MONGO_URI = "mongodb://localhost:27017"  # Lokale MongoDB
MONGO_DB_NAME = "careermentor"  # Standarddatenbank

def connect_to_mongodb(uri=MONGO_URI, db_name=MONGO_DB_NAME):
    """Verbindung zur MongoDB herstellen"""
    try:
        client = pymongo.MongoClient(uri)
        db = client[db_name]
        print(f"MongoDB-Verbindung erfolgreich hergestellt: {uri}")
        return db
    except Exception as e:
        print(f"Fehler beim Verbinden mit MongoDB: {e}")
        sys.exit(1)

def check_saved_jobs(db, user_id="12345"):
    """Gespeicherte Jobs für einen Benutzer aus MongoDB abrufen"""
    try:
        # Abrufen der Kollektion für gespeicherte Jobs (sollte mit der im Backend übereinstimmen)
        collection = db.global_state
        
        # Nach Dokumenten mit dem user_id und saved_jobs suchen
        query = {"user_id": user_id}
        result = collection.find_one(query)
        
        if result:
            print(f"\nBenutzer {user_id} in MongoDB gefunden:")
            
            # Prüfen, ob saved_jobs vorhanden ist
            if 'saved_jobs' in result and result['saved_jobs']:
                print(f"\nAnzahl gespeicherter Jobs: {len(result['saved_jobs'])}")
                # Details zu jedem gespeicherten Job anzeigen
                for i, job in enumerate(result['saved_jobs'], 1):
                    print(f"\n--- Job {i} ---")
                    print(f"Position: {job.get('position', 'Nicht angegeben')}")
                    print(f"ID: {job.get('id', 'Nicht angegeben')}")
                    print(f"Firma: {job.get('company', 'Nicht angegeben')}")
                    print(f"Ort: {job.get('location', 'Nicht angegeben')}")
            else:
                print("Keine gespeicherten Jobs für diesen Benutzer gefunden.")
        else:
            print(f"Kein Benutzer mit der ID {user_id} in der MongoDB gefunden.")
    except Exception as e:
        print(f"Fehler beim Abrufen der gespeicherten Jobs: {e}")

def main():
    """Hauptfunktion"""
    print("\n=== Überprüfung der gespeicherten Jobs in MongoDB ===\n")
    
    # Verbindung zur MongoDB herstellen
    db = connect_to_mongodb()
    
    # Standard-Benutzer-ID (sollte mit der im Frontend übereinstimmen)
    default_user_id = "12345"
    
    # Jobs für den Standardbenutzer prüfen
    print(f"\nÜberprüfe gespeicherte Jobs für Benutzer-ID: {default_user_id}")
    check_saved_jobs(db, default_user_id)
    
    # Optionale Prüfung für andere Benutzer
    test_user_id = "test_user"
    print(f"\nÜberprüfe gespeicherte Jobs für Benutzer-ID: {test_user_id}")
    check_saved_jobs(db, test_user_id)
    
    print("\n=== Überprüfung abgeschlossen ===")

if __name__ == "__main__":
    main()
