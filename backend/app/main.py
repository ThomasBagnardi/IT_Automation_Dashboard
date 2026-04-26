from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import devices, scripts
from app.routes import auth
from app.database import Base, engine
from app.models import User, Device, ScriptJob
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(scripts.router)

@app.get("/")
def root():
    return {"message": "IT Automation Dashboard API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)