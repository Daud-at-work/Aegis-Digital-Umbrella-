"""FastAPI app assembly and process lifecycle."""

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from .core import api_router, client
from .routers import auth, chat, scans, system, users  # noqa: F401

app = FastAPI(title="AEGIS Digital Umbrella API")
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
