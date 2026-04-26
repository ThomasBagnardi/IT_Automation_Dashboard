from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Device, User
from app.routes.auth import get_current_user
from pydantic import BaseModel
from app.crypto import encrypt_string

router = APIRouter(prefix="/devices")

# Define Pydantic model for device creation (now accepts optional host and ssh_username)
class DeviceCreate(BaseModel):
    name: str
    os: str
    host: Optional[str] = None
    ssh_username: Optional[str] = None

@router.post("/")
def create_device(
    device: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protected endpoint, requires authentication
):
    # include ssh_key and ssh_password in DeviceCreate:
    # ssh_key: Optional[str] = None
    # ssh_password: Optional[str] = None

    new_device = Device(
    name=device.name,
    os=device.os,
    status="online",
    host=device.host,
    ssh_username=device.ssh_username,
    ssh_key=encrypt_string(device.ssh_key) if device.ssh_key else None,
    ssh_password=encrypt_string(device.ssh_password) if device.ssh_password else None,
    )
    db.add(new_device)
    db.commit()
    return {"message": "Device added"}

@router.get("/")
def get_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protected endpoint, requires authentication
    ):
    return db.query(Device).all()

@router.delete("/{device_id}", status_code=status.HTTP_200_OK)
def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Protected endpoint
):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    db.delete(device)
    db.commit()
    return {"message": "Device deleted"}