from abc import ABC, abstractmethod

from google.adk.agents import Agent
from google.adk.auth import AuthCredential
from google.adk.tools.openapi_tool.openapi_spec_parser.openapi_toolset import (
    OpenAPIToolset,
)

from app.api.types.users import User


class BaseOpenAPIToolAgentConstructor(ABC):
    """Abstract base class for constructors of agents
    that use OpenAPI tool specifications"""

    def __init__(self, user: User, name: str, model: str, description: str):
        self.user = user
        self.name = name
        self.model = model
        self.description = description

    @abstractmethod
    def get_credentials(self) -> AuthCredential:
        """Get authentication credentials for the API"""
        pass

    @abstractmethod
    def get_openapi_spec(self) -> str:
        """Get the OpenAPI specification string"""
        pass

    @abstractmethod
    def get_instruction(self) -> str:
        """Get the instruction string for the agent"""
        pass

    def get_toolset(self) -> OpenAPIToolset:
        """Get the OpenAPI toolset for the agent"""
        auth_credential = self.get_credentials()
        openapi_spec = self.get_openapi_spec()

        return OpenAPIToolset(
            spec_str=openapi_spec, spec_str_type="yaml", auth_credential=auth_credential
        )

    def get_agent(self) -> Agent:
        """Get configured agent instance"""
        return Agent(
            name=self.name,
            model=self.model,
            tools=[self.get_toolset()],
            instruction=self.get_instruction(),
            description=self.description,
        )
