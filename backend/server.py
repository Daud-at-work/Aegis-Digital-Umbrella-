"""Compatibility entry point for existing `uvicorn server:app` commands."""

from app.main import app

__all__ = ["app"]

if __name__ == "__main__":
    try:
        import uvicorn  # type: ignore[import-not-found]
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "uvicorn is required to run this server. Install it with `pip install uvicorn`."
        ) from exc

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000)
