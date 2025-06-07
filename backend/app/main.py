from fastapi import FastAPI, Depends
import uvicorn
from app.connectors.databases import get_postgres
app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"} 

@app.get("/test")
async def test(db = Depends(get_postgres)):
    result = await db.fetch("SELECT * FROM users")
    return result


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)