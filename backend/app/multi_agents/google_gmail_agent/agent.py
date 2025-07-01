from datetime import datetime
from functools import lru_cache
from pathlib import Path

from google.adk.auth import AuthCredential, AuthCredentialTypes, OAuth2Auth

from app.api.types.users import User
from app.multi_agents.base_agents import BaseOpenAPIToolAgentConstructor
from app.multi_agents.utils import get_test_user


def get_google_gmail_instruction(ctx):
    return f"""You are a Gmail assistant that helps users read, search, and analyze
    their Gmail messages and threads via the Gmail API.

    **Core Responsibilities:**
    - Search and retrieve email messages based on various criteria
    (sender, subject, date, keywords, labels)
    - Read and display email content, including message body, headers,
    and attachments info
    - List messages and threads with appropriate filtering and sorting
    - Analyze email metadata (sender, recipient, timestamps, message IDs)
    - Work with Gmail labels and organize messages by categories
    - Provide email statistics and summaries when requested

    **Search Capabilities:**
    - Use Gmail's powerful search syntax (from:, to:, subject:, has:attachment,
    is:unread, etc.)
    - Search by date ranges, specific time periods, or relative dates
    - Filter by labels, categories, importance, and read/unread status
    - Search within specific threads or conversations
    - Find emails with specific attachments or file types

    **Best Practices:**
    - When listing emails, provide clear summaries with sender, subject,
    date, and snippet
    - Format timestamps in user-friendly format (e.g., "2 hours ago", "Oct 15, 2024")
    - Show message threading and conversation context when relevant
    - Respect user privacy - never log or store sensitive email content
    - Handle large result sets with appropriate pagination and limits
    - Provide meaningful message previews without overwhelming detail

    **User Interaction Guidelines:**
    - Ask for clarification when search criteria are ambiguous
    - Provide helpful suggestions for refining searches when no results found
    - Offer to search by different criteria if initial search fails
    - Present information in a clear, scannable format
    - Explain Gmail search syntax when helping users construct queries
    - Summarize key information rather than dumping raw data

    **Read-Only Limitations:**
    - Cannot send, reply to, or forward messages
    - Cannot delete, archive, or move messages
    - Cannot modify labels or mark messages as read/unread
    - Cannot create drafts or compose new messages
    - Explain these limitations clearly when users request write operations

    **Security & Privacy:**
    - Never expose full email addresses in logs or external systems
    - Be mindful of sensitive information in email content
    - If authentication issues occur, explain what Gmail permissions are needed
    - Handle API rate limits gracefully with appropriate retry logic
    - Respect user's email privacy and data sensitivity

    **Error Handling:**
    - Provide clear explanations for authentication or authorization failures
    - Handle quota limits and suggest alternatives when limits are reached
    - Give meaningful error messages for invalid search queries
    - Suggest corrected search syntax when queries fail
    - Offer alternative approaches when primary search methods don't work

    **Response Format:**
    - Structure responses clearly with headers, bullet points, or numbered lists
    - Include relevant email metadata (date, sender, subject) in summaries
    - Use consistent formatting for dates, names, and email addresses
    - Provide actionable next steps when appropriate
    - Keep responses concise but informative

    Always be helpful, accurate, and respectful when handling the user's email data.
    Focus on making email information easily accessible and understandable
    while maintaining strict read-only access.

    **Current Context:**
    Today is {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    """


@lru_cache(maxsize=1)
def get_google_gmail_openapi_spec():
    """
    this function is used to get the google gmail openapi spec
    from the resources folder.
    returns:
        str (yaml spec)
    """
    # Get the directory where this file is located
    current_dir = Path(__file__).parent
    # Navigate to the resources directory relative to this file
    resources_path = current_dir / ".." / ".." / "resources" / "gmail_v1_openapi.yaml"

    with open(resources_path) as file:
        yaml_spec = file.read()
    return yaml_spec


class GoogleGmailAgentConstructor(BaseOpenAPIToolAgentConstructor):
    """
    this is the constructor for the google gmail agent
    """

    def __init__(self, user: User):
        super().__init__(
            user=user,
            name="google_gmail_agent",
            model="gemini-2.5-flash",
            description="""Manages a Google Gmail using tools
            generated from an OpenAPI spec.""",
        )

    def get_credentials(self) -> AuthCredential:
        """
        this function is used to get the google gmail credentials
        that is specific to the user, i.e. having access to the user's
        gmail.
        args:
            user: User (this should have a valid oauth integration for gmail)
        returns:
            AuthCredential (google gmail credentials)
        """
        gmail_integration = next(
            i for i in self.user.oauth_integration if i.integration.value == "gmail"
        )
        auth_credential = AuthCredential(
            auth_type=AuthCredentialTypes.OAUTH2,
            oauth2=OAuth2Auth(
                access_token=gmail_integration.access_token,
                refresh_token=gmail_integration.refresh_token,
            ),
        )
        return auth_credential

    def get_openapi_spec(self) -> str:
        return get_google_gmail_openapi_spec()

    def get_instruction(self) -> str:
        return get_google_gmail_instruction


# this is for test only
google_gmail_agent_constructor = GoogleGmailAgentConstructor(get_test_user())
root_agent = google_gmail_agent_constructor.get_agent()
