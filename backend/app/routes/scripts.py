from fastapi import APIRouter, Depends, BackgroundTasks, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.models import ScriptJob, User, Device
from app.database import get_db, Sessionlocal
from app.routes.auth import get_current_user
import subprocess
import traceback
import paramiko
import io
import asyncio
from typing import List
from app.crypto import decrypt_string
import os
import tempfile

router = APIRouter(prefix="/scripts")


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
        except ValueError:
            pass

    async def broadcast(self, message: dict):
        dead = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for c in dead:
            self.disconnect(c)


manager = ConnectionManager()


async def execute_script_job_async(job_id: int):
    """
    Async wrapper for broadcasting from an async context (kept for consistency).
    """
    # This function is here for potential async-only flows.
    await asyncio.to_thread(execute_script_job, job_id)


def execute_script_job(job_id: int):
    """
    Background task that updates the ScriptJob record as it runs.
    Uses its own DB session (Sessionlocal) to avoid reusing the request session.
    Runs the stored command locally or via SSH depending on device.host.
    After updating the DB, broadcasts a job_update message over websockets.
    """
    db = Sessionlocal()
    try:
        job = db.query(ScriptJob).filter(ScriptJob.id == job_id).first()
        if job is None:
            return

        # mark as running
        job.status = "running"
        db.commit()

        cmd = job.command
        if not cmd:
            job.status = "failed"
            job.result = "No command provided for job."
            db.commit()
            # broadcast update
            _broadcast_job_update(job)
            return

        # Load device connection info
        device = db.query(Device).filter(Device.id == job.device_id).first()

        if device and device.host:
            # Remote execution via SSH using paramiko
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            try:
                connect_kwargs = {
                    "hostname": device.host,
                    "port": device.ssh_port or 22,
                    "username": device.ssh_username,
                    "timeout": 30,
                }
                # Prefer key file when provided
                if device.ssh_key:
                    connect_kwargs["key_filename"] = device.ssh_key
                elif device.ssh_password:
                    connect_kwargs["password"] = device.ssh_password

                ssh.connect(**connect_kwargs)

                stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
                out_bytes = stdout.read()
                err_bytes = stderr.read()
                out_str = out_bytes.decode(errors="replace") if isinstance(out_bytes, (bytes, bytearray)) else str(out_bytes)
                err_str = err_bytes.decode(errors="replace") if isinstance(err_bytes, (bytes, bytearray)) else str(err_bytes)
                exit_status = stdout.channel.recv_exit_status() if getattr(stdout, "channel", None) else 0

                job.result = f"exit_code: {exit_status}\n\nSTDOUT:\n{out_str}\n\nSTDERR:\n{err_str}"
                job.status = "success" if exit_status == 0 else "failed"
                db.commit()
            except Exception as exc:
                job.status = "failed"
                job.result = f"SSH execution error: {str(exc)}\n\nTraceback:\n{traceback.format_exc()}"
                db.commit()
            finally:
                try:
                    ssh.close()
                except Exception:
                    pass
        else:
            # Local execution fallback using subprocess
            try:
                proc = subprocess.run(
                    cmd,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=300  # seconds; adjust as needed
                )
                stdout = proc.stdout or ""
                stderr = proc.stderr or ""
                exit_code = proc.returncode

                job.result = f"exit_code: {exit_code}\n\nSTDOUT:\n{stdout}\n\nSTDERR:\n{stderr}"
                job.status = "success" if exit_code == 0 else "failed"
                db.commit()
            except subprocess.TimeoutExpired as te:
                job.status = "failed"
                job.result = f"TimeoutExpired: {str(te)}"
                db.commit()
            except Exception as exc:
                job.status = "failed"
                job.result = f"Execution exception: {str(exc)}\n\nTraceback:\n{traceback.format_exc()}"
                db.commit()
        # broadcast final update
        _broadcast_job_update(job)
    finally:
        db.close()


def _serialize_job(job: ScriptJob) -> dict:
    return {
        "id": job.id,
        "device_id": job.device_id,
        "command": job.command,
        "result": job.result,
        "status": job.status,
        "created_at": job.created_at.isoformat() if getattr(job, "created_at", None) else None,
    }


def _broadcast_job_update(job: ScriptJob):
    """
    Attempt to schedule a websocket broadcast with the updated job.
    Uses asyncio to schedule the async broadcast safely from sync context.
    """
    message = {"type": "job_update", "job": _serialize_job(job)}
    try:
        # If we're in an event loop, schedule a task
        loop = asyncio.get_running_loop()
        loop.create_task(manager.broadcast(message))
    except RuntimeError:
        # Not running in loop; try to get loop and submit coroutine thread-safe
        try:
            loop = asyncio.get_event_loop()
            asyncio.run_coroutine_threadsafe(manager.broadcast(message), loop)
        except Exception:
            # As a last resort, ignore broadcast (can't reach WS clients)
            pass


@router.post("/run", status_code=status.HTTP_202_ACCEPTED)
def run_script(
    device_id: int,
    command: str = None,
    background_tasks: BackgroundTasks = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Queue a script job for the given device and return immediately.
    Accepts optional `command` (string).
    """
    job = ScriptJob(device_id=device_id, command=command, status="queued", result=None)
    db.add(job)
    db.commit()
    db.refresh(job)

    # schedule background work using the created job id
    background_tasks.add_task(execute_script_job, job.id)

    return {"message": "Script queued", "job_id": job.id}


@router.get("/")
def get_script_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ScriptJob).all()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for script job updates.
    Connect to: ws://<host>:5000/scripts/ws
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive; clients may send pings or subscribe messages if needed.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)