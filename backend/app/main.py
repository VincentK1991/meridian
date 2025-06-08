import uvicorn
from fastapi import Depends, FastAPI

from app.api.middlewares.cors_middleware import add_cors_middleware
from app.api.routes.auth import router as auth_router
from app.api.types.users import User
from app.connectors.databases import get_postgres

app = FastAPI()

# Add CORS middleware
add_cors_middleware(app)

# Include routers
app.include_router(auth_router)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/test", response_model=User)
async def test(db=Depends(get_postgres)):
    result = dict(await db.fetchrow("SELECT * FROM users LIMIT 1"))
    return User(**result)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
