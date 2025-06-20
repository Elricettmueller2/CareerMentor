from database.models import setup_database, User
import os
import uuid

def init_database():
    """Initialize the database and create necessary tables"""
    print("Initializing database...")
    
    # Create database directory if it doesn't exist
    os.makedirs('database', exist_ok=True)
    
    # Set up the database
    session = setup_database()
    
    # Create a default user for testing
    default_user_id = "default_user"
    default_user = session.query(User).filter(User.id == default_user_id).first()
    
    if not default_user:
        default_user = User(
            id=default_user_id,
            username="default_user",
            email="default@example.com"
        )
        session.add(default_user)
        session.commit()
        print(f"Created default user: {default_user}")
    else:
        print(f"Default user already exists: {default_user}")
    
    session.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    init_database()
