from datetime import datetime
from functools import lru_cache
from pathlib import Path

from google.adk.auth import AuthCredential, AuthCredentialTypes, OAuth2Auth

from app.api.types.users import User
from app.multi_agents.base_agents import BaseOpenAPIToolAgentConstructor
from app.multi_agents.utils import get_test_user


def get_google_drive_instruction(ctx):
    return f"""You are a Google Drive assistant that helps manage files, folders,
    and documents in Google Drive via the Google Drive API.

    **Core Responsibilities:**
    - Search, list, and organize files and folders in Google Drive
    - Upload, download, and manage file content
    - Create, update, and delete files and folders
    - Manage file permissions and sharing settings
    - Handle file metadata, including names, descriptions, and properties
    - Work with various file types (documents, spreadsheets,
    presentations, images, etc.)

    **Best Practices:**
    - When listing files, specify search criteria and sorting preferences clearly
    - When uploading files, confirm the upload location and file details
    - When sharing files, explain the permission levels being granted
    - Always confirm successful completion of file operations
    (create, update, delete, move)
    - Provide clear file paths and folder structures when navigating
    - Handle file conflicts gracefully (duplicate names, version management)
    - Respect file size limits and supported file formats

    **User Interaction Guidelines:**
    - Ask for clarification when file or folder names are ambiguous
    - Provide helpful file information (size, type, last modified, owner)
    - Explain any permission restrictions or access issues encountered
    - Offer alternatives when requested operations aren't possible
    - Use clear, user-friendly descriptions for file and folder operations

    **Error Handling:**
    - If authentication issues occur, explain what Drive permissions are needed
    - Handle quota limits and storage constraints gracefully
    - Provide meaningful error messages for failed operations
    - Suggest alternative approaches when primary methods fail

    **Current Context:**
    Today is {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

    Always be helpful, accurate, and secure when managing the user's
    Google Drive content.
    """


@lru_cache(maxsize=1)
def get_google_drive_openapi_spec():
    """
    this function is used to get the google drive openapi spec
    from the resources folder.
    returns:
        str (yaml spec)
    """
    # Get the directory where this file is located
    current_dir = Path(__file__).parent
    # Navigate to the resources directory relative to this file
    resources_path = current_dir / ".." / ".." / "resources" / "drive_v3_openapi.yaml"

    with open(resources_path) as file:
        yaml_spec = file.read()
    return yaml_spec


class GoogleDriveAgentConstructor(BaseOpenAPIToolAgentConstructor):
    """
    this is the constructor for the google drive agent
    """

    def __init__(self, user: User):
        super().__init__(
            user=user,
            name="google_calendar_agent",
            model="gemini-2.5-flash",
            description="""Manages a Google Calendar using tools
            generated from an OpenAPI spec.""",
        )

    def get_credentials(self) -> AuthCredential:
        """
        this function is used to get the google drive credentials
        that is specific to the user, i.e. having access to the user's
        drive.
        args:
            user: User (this should have a valid oauth integration for drive)
        returns:
            AuthCredential (google drive credentials)
        """
        drive_integration = next(
            i for i in self.user.oauth_integration if i.integration.value == "drive"
        )
        auth_credential = AuthCredential(
            auth_type=AuthCredentialTypes.OAUTH2,
            oauth2=OAuth2Auth(
                access_token=drive_integration.access_token,
                refresh_token=drive_integration.refresh_token,
            ),
        )
        return auth_credential

    def get_openapi_spec(self) -> str:
        return get_google_drive_openapi_spec()

    def get_instruction(self) -> str:
        return get_google_drive_instruction


# this is for test only
google_drive_agent_constructor = GoogleDriveAgentConstructor(get_test_user())
root_agent = google_drive_agent_constructor.get_agent()
