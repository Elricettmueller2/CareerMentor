from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, create_engine, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import os
import json

# Create the SQLAlchemy base class
Base = declarative_base()

# Define the User model
class User(Base):
    __tablename__ = 'users'
    
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    saved_jobs = relationship("SavedJob", back_populates="user")
    search_history = relationship("SearchHistory", back_populates="user")
    
    def __repr__(self):
        return f"<User(id='{self.id}', username='{self.username}', email='{self.email}')>"

# Define the SavedJob model
class SavedJob(Base):
    __tablename__ = 'saved_jobs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    job_id = Column(String, nullable=False)
    job_title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String)
    description = Column(Text)
    job_data = Column(Text)  # Store full job data as JSON string
    saved_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="saved_jobs")
    
    def __repr__(self):
        return f"<SavedJob(id={self.id}, job_id='{self.job_id}', job_title='{self.job_title}')>"
    
    @property
    def full_job_data(self):
        """Return the job data as a dictionary"""
        if self.job_data:
            return json.loads(self.job_data)
        return {}

# Define the SearchHistory model
class SearchHistory(Base):
    __tablename__ = 'search_history'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    query = Column(String, nullable=False)
    searched_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="search_history")
    
    def __repr__(self):
        return f"<SearchHistory(id={self.id}, query='{self.query}')>"

# Database setup function
def setup_database(db_path='sqlite:///career_mentor.db'):
    """Set up the database and create tables if they don't exist"""
    engine = create_engine(db_path)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()

# Create a function to get a database session
def get_db_session(db_path='sqlite:///career_mentor.db'):
    """Get a database session"""
    engine = create_engine(db_path)
    Session = sessionmaker(bind=engine)
    return Session()

# Example usage
if __name__ == "__main__":
    # Set up the database
    session = setup_database()
    
    # Create a test user
    test_user = User(
        id="user123",
        username="testuser",
        email="test@example.com"
    )
    
    # Add the user to the session
    session.add(test_user)
    session.commit()
    
    print("Database setup complete with test user created.")
