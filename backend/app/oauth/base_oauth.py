from abc import ABC, abstractmethod


class BaseOAuth(ABC):
    @abstractmethod
    def get_auth_url(self):
        pass

    @abstractmethod
    def get_user_info(self, code: str, state: str):
        pass

    @abstractmethod
    def store_user_info(self):
        pass
