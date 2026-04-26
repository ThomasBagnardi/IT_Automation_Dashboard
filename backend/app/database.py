from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./it_automation.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Sessionlocal = sessionmaker(bind=engine)


Base = declarative_base()

# Dependency to close sessions for routes
def get_db():
    db = Sessionlocal()
    try:
        yield db
    finally:
        db.close()