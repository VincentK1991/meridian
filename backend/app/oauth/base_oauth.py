from abc import ABC, abstractmethod

from app.api.types.users import Integration, OAuthIntegration


class BaseOAuth(ABC):
    def __init__(self, integration_type: Integration):
        self.integration_type = integration_type

    @abstractmethod
    def get_auth_url(self):
        pass

    @abstractmethod
    def get_user_info(self, code: str, state: str):
        pass

    @abstractmethod
    def store_user_info(self):
        pass

    def deduplicate_integrations(
        self, integrations: list[OAuthIntegration]
    ) -> list[OAuthIntegration]:
        # Create a dictionary to store the latest integration for each type
        latest_integrations = {}

        # Iterate through integrations and keep the one with latest expires_at for each type
        for integration in integrations:
            integration_type = integration.integration
            if (
                integration_type not in latest_integrations
                or integration.expires_at
                > latest_integrations[integration_type].expires_at
            ):
                latest_integrations[integration_type] = integration

        # Convert back to list and return
        return list(latest_integrations.values())

    def get_integration_type(self) -> Integration:
        return self.integration_type

    @abstractmethod
    def refresh_access_token(cls, refresh_token: str):
        """Refresh the access token using the refresh token"""
        pass

    @abstractmethod
    def store_access_token(self, access_token: str):
        """Update the access token"""
        pass

    @abstractmethod
    def store_refresh_token(self, refresh_token: str):
        """Update the refresh token"""
        pass
