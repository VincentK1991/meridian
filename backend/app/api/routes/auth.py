from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from google.oauth2 import id_token
from google.auth.transport import requests
from google_auth_oauthlib.flow import Flow
from datetime import datetime, timedelta, timezone
import jwt
from pydantic import BaseModel
from app.connectors.mongo.connector import MongoDBConnector
from dotenv import load_dotenv
from bson.objectid import ObjectId

#from app.db.mongodb import get_database
import os

load_dotenv()

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

"""
FastAPI authentication module that handles Google OAuth2 authentication flow and JWT token management.

Authentication Flow:
1. User Initiates Login (/google/url)
   - Frontend requests Google auth URL
   - Backend generates OAuth consent screen URL
   - Frontend redirects user to Google consent screen
   - this uses the get_google_auth_url function via the router.get("/google/url") endpoint

2. Google OAuth Consent
   - User logs into Google account
   - User grants permissions for requested scopes
   - Google redirects back to frontend with authorization code
   - this uses the google_auth_callback function via the router.post("/google/callback") endpoint

3. Token Exchange (/google/callback)
   - Frontend sends authorization code to backend
   - Backend exchanges code for Google access/refresh tokens
   - Backend verifies Google token and extracts user info
   - Backend creates/updates user in MongoDB
   - Backend generates JWT token containing:
     * User information (email, name)
     * Google tokens (access, refresh)
     * Token expiration
   - Frontend receives JWT token
   - this uses the get_current_user function via the router.get("/me") endpoint

4. Session Management
   - Frontend stores JWT token
   - Frontend includes JWT in Authorization header
   - Backend validates JWT on protected endpoints (/me)
   - Backend can refresh tokens when needed (/refresh)

Protected Resources:
- /me: Returns current user profile
- /refresh: Refreshes expired tokens

Security Considerations:
- Google OAuth provides secure third-party authentication
- JWT tokens are signed to prevent tampering
- Refresh tokens stored in database for token renewal
- Environment variables used for sensitive credentials
- MongoDB stores user profiles and tokens securely

Required Environment Variables:
- APP_GOOGLE_CLIENT_ID: Google OAuth client ID
- APP_GOOGLE_CLIENT_SECRET: Google OAuth client secret
- GOOGLE_OAUTH_REDIRECT_URI: OAuth callback URL
- JWT_SECRET_KEY: Secret for signing JWTs
- ALGORITHM: JWT signing algorithm (e.g., HS256)
- ACCESS_TOKEN_EXPIRE_DAYS: JWT token lifetime

Required Scopes:
- drive.readonly: Access to Google Drive
- userinfo.email: User's email address
- userinfo.profile: User's basic profile
"""

# Add MongoDB connection management
async def get_db():
    """
    Async context manager that yields a MongoDB database connection.
    - Creates connection to MongoDB database
    - Uses MongoDBConnector class to manage connection lifecycle
    - Database connection is shared across all authentication functions
    - Automatically closes connection when done (using async context manager)
    """
    async with MongoDBConnector() as db:
        yield db.db

# Pydantic models
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class GoogleCallback(BaseModel):
    code: str
    state: str

class UserResponse(BaseModel):
    email: str
    name: str
    created_at: datetime
    updated_at: datetime

class CurrentUserResponse(BaseModel):
    id: str
    email: str
    name: str

client_config = {
    "web": {
        "client_id": os.getenv("APP_GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("APP_GOOGLE_CLIENT_SECRET"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "redirect_uris": [os.getenv("GOOGLE_OAUTH_REDIRECT_URI")]
    }
}

# Google OAuth flow setup
flow = Flow.from_client_config(
    client_config,
    scopes=[
        'openid',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ],
    redirect_uri=os.getenv("GOOGLE_OAUTH_REDIRECT_URI")
)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db = Depends(get_db)
):
    """
    Dependency function to validate JWT token and retrieve current user.
    
    Args:
        token (str): JWT token from request
        db: MongoDB database connection
    
    Returns:
        dict: User document from database
        
    Raises:
        HTTPException: If token is invalid or user not found

    Used for protected endpoints:
    1. Frontend includes JWT token in request header
    2. This function:
       a. Extracts token from request
       b. Verifies token signature using our secret key
       c. Extracts user email from token
       d. Looks up user in MongoDB
    3. If anything fails, user isn't authenticated
    4. Returns user data if successful
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

def create_jwt_token(user_data: dict, client_google_tokens: dict):
    """
    Creates a JWT token containing user data and Google OAuth tokens.
    Combines multiple pieces of information into a single token for efficient transmission.
    1. User data (email, name)
    2. Google OAuth tokens 
    2.1 google access token 
    2.2 google refresh token
    3. Expiration time
    
    The JWT consists of three Base64URL encoded sections separated by dots:
    1. Header: Contains the algorithm (HS256) and token type
        {
          "alg": "HS256",
          "typ": "JWT"
        }
    
    2. Payload: Contains the claims (user data and expiration)
        {
          "email": "user@example.com",
          "name": "John Doe",
          "client_google": {
              "access_token": "...",
              "refresh_token": "..."
          },
          "exp": "..." // Expiration timestamp
        }
    
    3. Signature: Verifies token integrity
        HMACSHA256(
            base64UrlEncode(header) + "." +
            base64UrlEncode(payload),
            secret_key
        )
    
    Note: While JWT is encoded, it is NOT encrypted. The header and payload 
    can be decoded by anyone. The signature ensures data hasn't been tampered with.
    
    Args:
        user_data (dict): User information including email and name
        client_google_tokens (dict): Google OAuth tokens including access and refresh tokens
    
    Returns:
        str: Encoded JWT token
    """
    to_encode = {
        "email": user_data["email"],
        "name": user_data["name"],
        "client_google": {
            "access_token": client_google_tokens["access_token"],
            "refresh_token": client_google_tokens["refresh_token"]
        },
        "exp": datetime.now(timezone.utc) + timedelta(days=int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "30")))
    }
    return jwt.encode(to_encode, os.getenv("JWT_SECRET_KEY"), algorithm=os.getenv("ALGORITHM"))

@router.get("/google/url")
async def get_google_auth_url(request: Request):
    """
    Generates Google OAuth authorization URL for client-side redirect.
    
    Returns:
        dict: Contains authorization URL for Google OAuth consent screen
    
    When user clicks 'Login with Google':
    1. Frontend calls this endpoint
    2. Backend generates special URL using Google's OAuth flow
    3. URL includes:
       - Our app's client ID
       - Requested permissions (scopes)
       - Where to redirect after login
    4. Frontend receives URL and redirects user to Google's login page
    """
    # Create a new flow instance for each request
    flow = Flow.from_client_config(
        client_config,
        scopes=[
            'openid',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ],
        redirect_uri=os.getenv("GOOGLE_OAUTH_REDIRECT_URI")
    )

    # Generate authorization URL with required parameters
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes=False,
        prompt='consent'
    )

    # Store the state in the session
    # request.session['state'] = state

    return {"url": authorization_url}

@router.post("/google/callback", response_model=TokenResponse)
async def google_auth_callback(
    callback_data: GoogleCallback,
    db = Depends(get_db)
):
    """
    Handles Google OAuth callback, validates tokens, and creates user session.
    
    Args:
        callback_data (GoogleCallback): Contains OAuth authorization code
        db: MongoDB database connection
    
    Returns:
        TokenResponse: Contains JWT access token, token type, and user data
        
    Raises:
        HTTPException: If Google credentials validation fails

    After user logs in with Google:
    1. Google redirects to our frontend with a temporary 'code'
    2. Frontend sends this code to this endpoint
    3. Backend:
       a. Exchanges code for Google access/refresh tokens
       b. Verifies tokens with Google to get user info
       c. Creates/updates user in our MongoDB:
          - Email and name from Google
          - Stores Google tokens for later use
       d. Creates our own JWT token containing:
          - User info (email, name)
          - Google tokens (for accessing Google services later)
          - Expiration time
    4. Frontend receives our JWT token for future requests
    """
    # Retrieve state from session
    # state = request.session.get('state')
    # if not state:
    #     raise HTTPException(status_code=400, detail="State missing in session.")

    # Recreate the flow with the same state
    flow = Flow.from_client_config(
        client_config,
        scopes=[
            'openid',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ],
        state=callback_data.state,  # Use state from the request
        redirect_uri=os.getenv("GOOGLE_OAUTH_REDIRECT_URI")
    )

    # Fetch the token using the authorization code
    try:
        flow.fetch_token(code=callback_data.code)
    except Exception as token_error:
        print(f"Token fetch error: {str(token_error)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to exchange authorization code. Please try signing in again."
        )

    # Use the credentials from the flow
    credentials = flow.credentials

    try:
        id_info = id_token.verify_oauth2_token(
            credentials.id_token, 
            requests.Request(), 
            os.getenv("APP_GOOGLE_CLIENT_ID")
        )
    except Exception as verify_error:
        print(f"Token verification error: {str(verify_error)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to verify Google credentials. Please try signing in again."
        )
        
    current_time = datetime.utcnow()
        
    # Get existing user or generate new ID
    existing_user = await db.users.find_one({"email": id_info["email"]})
    user_id = existing_user["_id"] if existing_user else str(ObjectId())
        
    user_data = {
        "_id": user_id,
        "email": id_info["email"],
        "name": id_info["name"],
        "created_at": current_time,
        "updated_at": current_time,
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token
    }

    # Update or insert user
    result = await db.users.update_one(
        {"email": user_data["email"]},
        {
            "$set": {
                "name": user_data["name"],
                "access_token": user_data["access_token"],
                "refresh_token": user_data["refresh_token"],
                #"client_google_tokens": user_data["client_google_tokens"],
                "updated_at": current_time
            },
            "$setOnInsert": {
                "_id": user_id,
                "created_at": current_time
            }
        },
        upsert=True
    )

    # Create initial session for new users
    if result.upserted_id:
        initial_session = {
            "_id": str(ObjectId()),
            "user_id": user_id,
            "session_name": "Welcome Chat",
            "is_active": True,
            "created_at": current_time,
            "last_activity": current_time,
            "messages": []
        }
        await db.sessions.insert_one(initial_session)

    # Create JWT token
    client_google_tokens = {
        "access_token": user_data["access_token"],
        "refresh_token": user_data["refresh_token"]
    }
    jwt_token = create_jwt_token(user_data, client_google_tokens)

    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,  # Include _id in response
            "email": user_data["email"],
            "name": user_data["name"]
        }
    }

    # except HTTPException:
    #     raise
    # except Exception as e:
    #     print(f"Authentication error: {str(e)}")
    #     print(f"Error type: {type(e)}")
    #     import traceback
    #     print(f"Traceback: {traceback.format_exc()}")
        
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Authentication failed. Please try again."
    #     )

@router.get("/me", response_model=CurrentUserResponse)
async def read_users_me(current_user = Depends(get_current_user)):
    """
    Example of protected endpoint.
    1. Frontend includes JWT token in request header
    2. get_current_user verifies token signature using our secret key
    3. returns user profile from mongoDB if authenticated

    Returns the current authenticated user's information.
    
    Args:
        current_user: User document from database (injected by dependency)
    
    Returns:
        dict: Current user's information
    """
    return_package = {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "name": current_user["name"]
    }
    print("current user: ", return_package)
    return return_package

@router.post("/refresh")
async def refresh_token(current_user = Depends(get_current_user)):
    """
    Token renewal endpoint (placeholder).

    Endpoint to refresh the user's access token using stored refresh token.
    Currently a placeholder for token refresh implementation.
    
    Args:
        current_user: User document from database (injected by dependency)
    """
    # Implement token refresh logic here
    # You would use the stored refresh_token to get new Google access token
    pass

if __name__ == "__main__":
    import os
    import asyncio
    print("Authentication endpoints")
    user_data = {"email": "test@example.com", "name": "Test User"}
    client_google_tokens = {"access_token": "test_token", "refresh_token": "test_refresh_token"}
    print("jwt token: ", create_jwt_token(user_data, client_google_tokens))
    url = asyncio.run(get_google_auth_url())
    print("google auth url: ", url)