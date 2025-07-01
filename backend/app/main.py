import asyncio
from contextlib import asynccontextmanager

import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app.api.middlewares.cors_middleware import add_cors_middleware
from app.api.routes.auth import router as auth_router
from app.api.routes.message import router as message_router
from app.api.routes.oauth_integration import router as oauth_integration_router
from app.api.routes.session import router as session_router
from app.api.types.users import User
from app.connectors.databases import get_postgres
from app.connectors.neo4j import Neo4jConnector
from app.connectors.postgres import PostgreSQLConnector


async def verify_database_connections():
    """Verify database connections with timeout and retry logic"""

    # PostgreSQL verification with timeout
    print("🔍 Verifying PostgreSQL connection...")
    try:
        # Add timeout to prevent hanging
        async with asyncio.timeout(10):  # 10 second timeout
            async with PostgreSQLConnector.get_connection() as conn:
                await conn.fetchval("SELECT 1")
        print("✅ PostgreSQL connection verified")
    except TimeoutError:
        print("⚠️ PostgreSQL connection timeout - may have hanging connections")
        print("🔄 Attempting to reset connection pool...")
        try:
            # Close existing pool and create a new one
            await PostgreSQLConnector.close_pool()
            # Wait a moment for cleanup
            await asyncio.sleep(1)
            # Try again with fresh pool
            async with asyncio.timeout(5):
                async with PostgreSQLConnector.get_connection() as conn:
                    await conn.fetchval("SELECT 1")
            print("✅ PostgreSQL connection recovered")
        except Exception as recovery_error:
            print(f"❌ PostgreSQL recovery failed: {recovery_error}")
    except Exception as e:
        print(f"⚠️ PostgreSQL connection error: {e}")

    # Neo4j verification with timeout
    print("🔍 Verifying Neo4j connection...")
    try:
        async with asyncio.timeout(10):  # 10 second timeout
            neo4j_connected = await Neo4jConnector.verify_connectivity()
        if neo4j_connected:
            print("✅ Neo4j connection verified")
        else:
            print("⚠️ Neo4j connection failed")
    except TimeoutError:
        print("⚠️ Neo4j connection timeout")
    except Exception as e:
        print(f"⚠️ Neo4j connection error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting up application...")

    # First, try to clean up any existing connections
    print("🧹 Cleaning up any existing connections...")
    try:
        await PostgreSQLConnector.close_pool()
        await Neo4jConnector.close_driver()
        # Wait for cleanup to complete
        await asyncio.sleep(0.5)
    except Exception as e:
        print(f"⚠️ Cleanup warning (expected on first start): {e}")

    # Now verify fresh connections
    await verify_database_connections()

    yield

    # Shutdown
    print("🛑 Shutting down application...")

    # Close database connections with timeout
    try:
        async with asyncio.timeout(5):
            await PostgreSQLConnector.close_pool()
        print("✅ PostgreSQL connection pool closed")
    except TimeoutError:
        print("⚠️ PostgreSQL pool close timeout - forcing cleanup")
    except Exception as e:
        print(f"❌ Error closing PostgreSQL pool: {e}")

    try:
        async with asyncio.timeout(5):
            await Neo4jConnector.close_driver()
        print("✅ Neo4j driver closed")
    except TimeoutError:
        print("⚠️ Neo4j driver close timeout - forcing cleanup")
    except Exception as e:
        print(f"❌ Error closing Neo4j driver: {e}")

    print("👋 Application shutdown complete")


app = FastAPI(lifespan=lifespan)


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
app.include_router(message_router)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/test", response_model=User)
async def test(db=Depends(get_postgres)):
    result = dict(await db.fetchrow("SELECT * FROM users LIMIT 1"))
    return User(**result)


if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8080, reload=True)
