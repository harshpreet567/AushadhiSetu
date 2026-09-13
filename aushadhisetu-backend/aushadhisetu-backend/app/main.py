from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.seed import seed_database
from app.routers import (
    auth,
    dashboard,
    inventory,
    alerts,
    surplus,
    facilities,
    recommendations,
    transfers
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema is created and seeded with demo data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown logic (if any)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire up routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(inventory.router)
app.include_router(alerts.router)
app.include_router(surplus.router)
app.include_router(facilities.router)
app.include_router(recommendations.router)
app.include_router(transfers.router)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "motto": "Right Medicine · Right Facility · Right Time",
        "status": "operational",
        "version": settings.PROJECT_VERSION,
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
