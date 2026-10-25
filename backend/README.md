# Backend structure

On a new Windows PC, set up the backend from this directory with:

```powershell
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```

Fill in `.env` before starting the API. The project root README has the complete frontend and backend setup steps.

`server.py` is the stable entry point. It loads the modular FastAPI application from `app/main.py`.

## Code layout

- `app/config.py` loads `.env` settings and configures logging.
- `app/database.py` creates the MongoDB client.
- `app/models.py` defines request and response models.
- `app/security.py` handles password hashing, reset tokens, and reset email delivery.
- `app/utils/text.py` contains text formatting and sanitization helpers.
- `app/core.py` exposes the shared API router and common dependencies.
- `app/routers/` contains authentication, profile, scanning, chat, and health endpoints.
- `app/services/` contains the scanner, Gemini client, AI responses, and PDF/CSV report generation.
- `requirements.txt` lists Python dependencies; `.env` stores local configuration and secrets.

Keep route handlers in `app/routers/` and reusable work in `app/services/` so each feature remains easy to update.
