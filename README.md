# Meridian Project

This project is a monorepo containing a FastAPI backend and a React frontend.

## Project Structure

- `backend/`: FastAPI application
- `frontend/`: React application (Vite)

## Getting Started

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```

2.  Install `uv` if you haven't already. You can find instructions at the [official `uv` website](https://astral.sh/docs/uv#installation).

3.  Create a virtual environment:
    ```bash
    python3.12 -m venv .venv
    ```

4.  Activate the virtual environment:
    ```bash
    source .venv/bin/activate
    ```
    (On Windows, use `.venv\Scripts\activate`)

5.  Install the dependencies:
    ```bash
    uv pip install -e .
    ```

6.  to update the environment from existing uv pyproject.toml
    ```bash
    uv sync
    ```

7.  Run the backend server:
    ```bash
    uvicorn app.main:app --reload
    ```
    The backend will be running at `http://127.0.0.1:8000`.

8. ro run pre-commit hook to check linting:
    ```bash
    pre-commit run --all-files
    ```

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Run the frontend development server:
    ```bash
    npm run dev
    ```
    The frontend will be running at `http://localhost:5173`.
