from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

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


# ============================================================
# DATABASE STARTUP
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Seed demo data
    seed_database()

    yield


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(inventory.router)
app.include_router(alerts.router)
app.include_router(surplus.router)
app.include_router(facilities.router)
app.include_router(recommendations.router)
app.include_router(transfers.router)


# ============================================================
# SWAGGER JWT AUTHENTICATION
# ============================================================

def custom_openapi():
    """
    Add Bearer JWT authentication to Swagger UI.
    """

    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        description=settings.DESCRIPTION,
        routes=app.routes,
    )

    # --------------------------------------------------------
    # Add Bearer authentication scheme
    # --------------------------------------------------------

    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    # --------------------------------------------------------
    # Protect API endpoints in Swagger
    # --------------------------------------------------------

    for path, methods in openapi_schema["paths"].items():

        # Login and signup must remain public
        if path in ["/auth/login", "/auth/signup"]:
            continue

        for method, operation in methods.items():
            if method in [
                "get",
                "post",
                "put",
                "patch",
                "delete",
                "options",
                "head"
            ]:
                operation["security"] = [
                    {
                        "bearerAuth": []
                    }
                ]

    app.openapi_schema = openapi_schema

    return app.openapi_schema


app.openapi = custom_openapi


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "motto": "Right Medicine · Right Facility · Right Time",
        "status": "operational",
        "version": settings.PROJECT_VERSION,
        "documentation": "/docs"
    }


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )