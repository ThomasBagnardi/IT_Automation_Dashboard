from cryptography.fernet import Fernet, InvalidToken
import os
from dotenv import load_dotenv

load_dotenv()

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise RuntimeError(
        "ENCRYPTION_KEY environment variable is not set.\n"
        "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
    )

fernet = Fernet(ENCRYPTION_KEY.encode())


def encrypt_string(value: str) -> str:
    if value is None:
        return None
    token = fernet.encrypt(value.encode())
    return token.decode()


def decrypt_string(token: str) -> str:
    if not token:
        return None
    try:
        data = fernet.decrypt(token.encode())
        return data.decode()
    except InvalidToken:
        return None
