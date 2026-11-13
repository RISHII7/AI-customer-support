"""Quick smoke test for NVIDIA NIM integration."""
from app.config import classifier_model, agent_model

print("=== Test 1: Classifier model (Nemotron) ===")
from pydantic_ai import Agent
from pydantic import BaseModel, Field

class SimpleClassification(BaseModel):
    category: str = Field(description="Category of the message")
    is_urgent: bool = Field(description="Whether the message is urgent")

test_agent = Agent(classifier_model, output_type=SimpleClassification)
result = test_agent.run_sync("I need help, my paddle board is leaking air!")
print(f"Category: {result.output.category}")
print(f"Urgent: {result.output.is_urgent}")
print("✅ Classifier model works!\n")

print("=== Test 2: Agent model (Mistral Large) ===")
agent = Agent(agent_model)
result = agent.run_sync("Say 'Hello from NVIDIA NIM!' and nothing else.")
print(f"Response: {result.output}")
print("✅ Agent model works!\n")

print("🎉 Both NVIDIA NIM models are working!")

