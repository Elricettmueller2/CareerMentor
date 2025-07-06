#!/usr/bin/env python
"""
MongoDB Inspection Script for CareerMentor

Dieses Skript untersucht die MongoDB-Datenbank und zeigt die Struktur und Inhalte an.
"""

import os
import sys
import json
# Entferne dotenv-Import, da nicht installiert
from pprint import pprint

# Add the parent directory to the path so we can import the services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.mongodb.client import mongo_client

def inspect_mongodb():
    """Untersucht die MongoDB-Datenbank und zeigt die Struktur und Inhalte an"""
    print("\n=== MongoDB Verbindungsinformationen ===")
    db_name = mongo_client.db.name
    print(f"Verbunden mit Datenbank: {db_name}")
    
    print("\n=== Verfügbare Collections ===")
    collections = mongo_client.db.list_collection_names()
    if not collections:
        print("Keine Collections gefunden.")
    else:
        for collection in collections:
            count = mongo_client.db[collection].count_documents({})
            print(f"- {collection}: {count} Dokumente")
    
    print("\n=== Beispieldokumente aus jeder Collection ===")
    for collection in collections:
        print(f"\n--- Collection: {collection} ---")
        documents = list(mongo_client.db[collection].find().limit(1))
        if not documents:
            print("Keine Dokumente gefunden.")
        else:
            for doc in documents:
                # Konvertiere ObjectId zu String für bessere Lesbarkeit
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
                print("Dokumentstruktur:")
                pprint(doc)
                
                # Zeige Felder und Datentypen an
                print("\nFeldstruktur:")
                for key, value in doc.items():
                    print(f"- {key}: {type(value).__name__}")
    
    print("\n=== Indizes ===")
    for collection in collections:
        print(f"\n--- Indizes für {collection} ---")
        indexes = list(mongo_client.db[collection].list_indexes())
        for index in indexes:
            print(f"- {index['name']}: {index['key']}")

if __name__ == "__main__":
    # Entferne load_dotenv-Aufruf
    
    # Inspect MongoDB
    inspect_mongodb()
