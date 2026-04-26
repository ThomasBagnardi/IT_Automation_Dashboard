# IT Automation Dashboard

A web-based dashboard for managing and automating IT infrastructure operations. Execute scripts on remote devices, manage device inventory, and monitor execution history through an intuitive user interface.

## Overview

The IT Automation Dashboard provides centralized control over your IT infrastructure, enabling secure authentication, device management, and remote script execution across your environment.

## Features

### User Management
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **User Registration & Login**: Create accounts and authenticate securely
- **Session Management**: 30-minute access token expiration for security

### Device Management
- **Device Inventory**: Register and organize devices (servers, computers, etc.)
- **SSH Connectivity**: Support for SSH-based remote connections
- **Device Status Tracking**: Monitor device online/offline status
- **Multiple OS Support**: Manage devices across different operating systems

### Script Execution
- **Remote Command Execution**: Execute scripts and commands on registered devices
- **Real-time Monitoring**: WebSocket-based real-time output streaming
- **Execution History**: Track all script jobs, results, and timestamps
- **Background Tasks**: Execute long-running scripts without blocking the UI

### Security
- **Encrypted Credentials**: SSH credentials are encrypted at rest in the database
- **CORS Protection**: Configured CORS middleware for secure cross-origin requests
- **Protected Endpoints**: Authentication required for all management operations

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework with async support
- **SQLAlchemy**: SQL toolkit and Object-Relational Mapping (ORM)
- **Alembic**: Database migration tool
- **Uvicorn**: ASGI server for running the API
- **Pydantic**: Data validation using Python type annotations
- **Python-Jose**: JWT token creation and verification
- **Passlib + Bcrypt**: Secure password hashing
- **Paramiko**: SSH protocol implementation

### Frontend
- **React.js**: UI component framework
- **JavaScript**: Application logic

### Database
- **SQLite** (default) / **PostgreSQL** (configurable)

## Project Structure

```
it-automation-dashboard/
├── backend/                      # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── database.py          # Database configuration and session
│   │   ├── models.py            # SQLAlchemy data models
│   │   ├── crypto.py            # Encryption utilities
│   │   └── routes/
│   │       ├── auth.py          # Authentication endpoints
│   │       ├── devices.py       # Device management endpoints
│   │       └── scripts.py       # Script execution endpoints
│   ├── alembic/                 # Database migrations
│   │   ├── env.py
│   │   └── versions/
│   └── alembic.ini              # Alembic configuration
├── frontend/                    # React.js frontend
│   ├── pages/
│   │   ├── Dashboard.js         # Main dashboard component
│   │   └── Login.js             # Authentication page
│   └── src/
│       └── App.js               # Main application component
└── README.md                    # This file
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 14+ (for frontend development)
- Git

### Backend Setup

1. **Clone the repository** (if needed):
   ```bash
   git clone <repository-url>
   cd it-automation-dashboard
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv virtual_env
   # On Windows:
   virtual_env\Scripts\activate
   # On macOS/Linux:
   source virtual_env/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory:
   ```bash
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=sqlite:///./app.db  # or postgresql://user:password@localhost/dbname
   ```

5. **Initialize the database**:
   ```bash
   cd backend
   alembic upgrade head
   ```

6. **Run the backend server**:
   ```bash
   python -m app.main
   ```
   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get current user information

### Devices
- `GET /devices/` - List all devices
- `POST /devices/` - Create a new device
- `GET /devices/{device_id}` - Get device details
- `PUT /devices/{device_id}` - Update device information
- `DELETE /devices/{device_id}` - Delete a device

### Scripts
- `GET /scripts/` - List script execution history
- `POST /scripts/execute` - Execute a script on a device
- `GET /scripts/{job_id}` - Get script job details
- `WebSocket /scripts/ws/{job_id}` - Real-time execution output stream

## Usage Examples

### 1. Register a User
```bash
curl -X POST "http://localhost:5000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "securepassword"}'
```

### 2. Login
```bash
curl -X POST "http://localhost:5000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "securepassword"}'
```

### 3. Create a Device
```bash
curl -X POST "http://localhost:5000/devices/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server 1",
    "os": "Linux",
    "host": "192.168.1.10",
    "ssh_username": "root",
    "ssh_port": 22
  }'
```

### 4. Execute a Script
```bash
curl -X POST "http://localhost:5000/scripts/execute" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": 1,
    "command": "ls -la /var/log"
  }'
```

## Database Models

### User
- `id`: Primary key
- `username`: Unique username
- `hashed_password`: Bcrypt-hashed password

### Device
- `id`: Primary key
- `name`: Device name
- `os`: Operating system
- `host`: IP address or hostname
- `ssh_username`: SSH username
- `ssh_port`: SSH port (default: 22)
- `ssh_key`: Path to SSH private key
- `ssh_password`: SSH password (encrypted)
- `status`: Device status (online/offline)

### ScriptJob
- `id`: Primary key
- `device_id`: Foreign key to Device
- `command`: Command/script to execute
- `result`: Execution output/result
- `status`: Job status (pending/running/completed/failed)
- `created_at`: Timestamp of job creation

## Development Notes

### Database Migrations
To create a new migration after modifying models:
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Security Considerations
- Always use HTTPS in production
- Store `SECRET_KEY` securely (use environment variables)
- Rotate access tokens periodically
- Encrypt SSH credentials in the database
- Validate all user inputs
- Use strong SSH key authentication when possible

### Running Tests
```bash
pytest backend/tests/
```

## Contributing
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License
[Specify your license here]

## Support
For issues, questions, or feature requests, please open an issue on the repository.

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly configured
- Verify the database file/server is accessible
- Run migrations: `alembic upgrade head`

### Authentication Errors
- Verify `SECRET_KEY` is set in environment variables
- Check token expiration (30 minutes default)
- Ensure correct credentials are being used

### SSH Connection Issues
- Verify device host/IP is reachable
- Check SSH port (default: 22)
- Ensure SSH credentials are correct
- Verify SSH service is running on target device

