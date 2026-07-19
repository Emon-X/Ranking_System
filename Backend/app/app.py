from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from .database.db import Base, engine
from .routers.contest import router as contest_router
from .routers.user import router as user_router
from .routers.auth import auth_router
from .routers.admin import router as admin_router
from .models import Participant, Contest
from fastapi.openapi.utils import get_openapi


app = FastAPI(
    title="Rating System",
    description="A simple rating system API",
    version="1.0.0",
)

from fastapi.middleware.cors import CORSMiddleware

from .database.migration import migrate_db

@app.on_event("startup")
async def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    migrate_db(engine)


origins = [
    "http://localhost:5173",
    "https://your-frontend.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(contest_router)
app.include_router(admin_router)


def custom_openapi():
    
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Blog API",
        version="1.0.0",
        description="This is a simple Blog API built with FastAPI.",
        routes=app.routes,
    )
    
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer":{
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT token in the format: Bearer <token>"
        }
    }
    
    for path, methods in openapi_schema.get("paths", {}).items():
        if "/auth" not in path and path!="/":
            for method in methods.values():
                if isinstance(method,dict):
                    method["security"] = [{"Bearer": []}]
   
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.get("/")
async def Home_Page():
    return {"message": "Welcome to the Rating System!"}
