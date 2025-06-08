from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def add_cors_middleware(app: FastAPI):
    """
    Add CORS middleware to allow frontend connections
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",  # Vite dev server
            "http://127.0.0.1:5173",  # Alternative localhost
            "http://localhost:3000",  # React dev server (if needed)
        ],
        allow_credentials=True,  # Important for cookies/auth
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "User-Agent",
            "DNT",
            "Cache-Control",
            "X-Mx-ReqToken",
            "Keep-Alive",
            "X-Requested-With",
            "If-Modified-Since",
        ],
    )
