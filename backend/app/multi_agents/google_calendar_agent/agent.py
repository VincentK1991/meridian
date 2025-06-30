from datetime import datetime
from functools import lru_cache

from base_agents import BaseOpenAPIToolAgentConstructor
from google.adk.auth import AuthCredential, AuthCredentialTypes, OAuth2Auth
from utils import get_test_user

from app.api.types.users import User


def get_google_calendar_instruction(ctx):
    return f"""You are a Google Calendar assistant that helps manage calendars
    and events via the Google Calendar API.
    Use the available tools to fulfill user requests about their calendar needs.
    When creating a new calendar, confirm the details
    and provide the calendar ID back to the user.
    When listing calendars, specify any filters or parameters used in the request.
    When creating, updating or deleting events, always confirm
    the action was completed successfully.
    Provide clear responses about calendar availability, event details,
     and scheduling conflicts.
    Format dates and times in a user-friendly way when
    displaying calendar information.
    If you need additional permissions or encounter authentication issues,
    explain what access is needed.
    today is {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    """


@lru_cache(maxsize=1)
def get_google_calendar_openapi_spec():
    """
    this function is used to get the google calendar openapi spec
    from the resources folder.
    returns:
        str (yaml spec)
    """
    with open("../../resources/calendar_v3_openapi.yaml") as file:
        yaml_spec = file.read()
    return yaml_spec


class GoogleCalendarAgentConstructor(BaseOpenAPIToolAgentConstructor):
    """
    this is the constructor for the google calendar agent
    """

    def __init__(self, user: User):
        super().__init__(
            user=user,
            name="google_calendar_agent",
            model="gemini-2.0-flash",
            description="Manages a Google Calendar using tools generated from an OpenAPI spec.",
        )

    def get_credentials(self) -> AuthCredential:
        """
        this function is used to get the google calendar credentials
        that is specific to the user, i.e. having access to the user's
        calendar and events.
        args:
            user: User (this should have a valid oauth integration for calendar)
        returns:
            AuthCredential (google calendar credentials)
        """
        calendar_integration = next(
            i for i in self.user.oauth_integration if i.integration.value == "calendar"
        )
        auth_credential = AuthCredential(
            auth_type=AuthCredentialTypes.OAUTH2,
            oauth2=OAuth2Auth(
                access_token=calendar_integration.access_token,
                refresh_token=calendar_integration.refresh_token,
            ),
        )
        return auth_credential

    def get_openapi_spec(self) -> str:
        return get_google_calendar_openapi_spec()

    def get_instruction(self) -> str:
        return get_google_calendar_instruction


# this is for test only
root_agent = GoogleCalendarAgentConstructor(get_test_user()).get_agent()
