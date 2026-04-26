from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    os = Column(String)
    status = Column(String, default="offline")

    # SSH / connection fields for remote execution
    host = Column(String, nullable=True)             # IP or hostname for SSH
    ssh_username = Column(String, nullable=True)
    ssh_port = Column(Integer, nullable=True, default=22)
    ssh_key = Column(String, nullable=True)          # path to private key file (optional)
    ssh_password = Column(String, nullable=True)     # optional (insecure to store passwords in DB)

    # Relationship to ScriptJob
    script_jobs = relationship("ScriptJob", back_populates="device", cascade="all, delete-orphan")

class ScriptJob(Base):
    __tablename__ = "script_jobs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False, index=True)
    command = Column(String, nullable=True)
    result = Column(String, nullable=True)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship back to Device
    device = relationship("Device", back_populates="script_jobs")