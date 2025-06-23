import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app.api.middlewares.cors_middleware import add_cors_middleware
from app.api.routes.auth import router as auth_router
from app.api.routes.oauth_integration import router as oauth_integration_router
from app.api.routes.session import router as session_router
from app.api.types.users import User
from app.connectors.databases import get_postgres

app = FastAPI()


# Custom exception handler for HTTPException
@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    print(f"HTTPException: {exc.status_code} - {exc.detail}")
    print(f"Request: {request.method} {request.url}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


# Add CORS middleware
add_cors_middleware(app)

# Include routers
app.include_router(auth_router)
app.include_router(session_router)
app.include_router(oauth_integration_router)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/test", response_model=User)
async def test(db=Depends(get_postgres)):
    result = dict(await db.fetchrow("SELECT * FROM users LIMIT 1"))
    return User(**result)


if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
