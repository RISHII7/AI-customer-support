from dotenv import load_dotenv
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_settings import BaseSettings

# Load .env into the environment, so Pydantic AI also finds NVIDIA_API_KEY.
load_dotenv()


class Settings(BaseSettings):
    google_client_id: str
    google_client_secret: str
    google_refresh_token: str
    database_url: str
    nvidia_api_key: str
    classifier_model: str = "nvidia/nemotron-3.5-bolt-e4b"
    agent_model: str = "mistralai/mistral-large-4-1t-a52b"
    poll_interval_seconds: int = 60
    dashboard_username: str = "admin"
    dashboard_password: str = ""


settings = Settings()

# OpenAI-compatible provider pointing to NVIDIA NIM
_nvidia_provider = OpenAIProvider(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=settings.nvidia_api_key,
)

classifier_model = OpenAIChatModel(settings.classifier_model, provider=_nvidia_provider)
agent_model = OpenAIChatModel(settings.agent_model, provider=_nvidia_provider)
