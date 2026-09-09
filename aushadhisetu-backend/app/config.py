import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root if it exists
base_dir = Path(__file__).resolve().parent.parent
dotenv_path = base_dir / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = "AushadhiSetu API"
    PROJECT_VERSION: str = "1.0.0"
    DESCRIPTION: str = "Right Medicine · Right Facility · Right Time — Medicine Redistribution & Risk Mitigation Network"

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aushadhisetu.db")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "aushadhisetu-super-secret-key-2026-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "*")

    @property
    def cors_origins(self) -> list[str]:
        if self.CORS_ORIGINS_RAW.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]

    # Blockchain / Settlement configuration
    ALGORAND_NETWORK: str = os.getenv("ALGORAND_NETWORK", "testnet")
    ALGORAND_EXPLORER_URL: str = os.getenv("ALGORAND_EXPLORER_URL", "https://testnet.algoexplorer.io")
    GOPLAUSIBLE_FACILITATOR_KEY: str = os.getenv("GOPLAUSIBLE_FACILITATOR_KEY", "gp_live_fac_9942a78e1c2")
    X402_PROTOCOL_VERSION: str = os.getenv("X402_PROTOCOL_VERSION", "v1.2")

settings = Settings()
