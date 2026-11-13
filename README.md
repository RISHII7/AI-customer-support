# AI Customer Support

An intelligent, multi-agent AI customer support system built with **FastAPI**, **Pydantic AI**, **NVIDIA NIM Models** (Nemotron & Mistral Large), and **PostgreSQL**, with automated Gmail integration.

---

## 🚀 Overview

This service automates customer support workflows by:
- Monitoring incoming customer support emails via Google APIs.
- Classifying incoming tickets/inquiries using fast LLM models (`nvidia/nemotron-3.5-bolt-e4b`).
- Generating context-aware support resolutions and responses via advanced LLM agents (`mistralai/mistral-large-4-1t-a52b`).
- Persisting customer support interactions and ticket state in PostgreSQL.
- Providing a FastAPI backend for health checks, API endpoints, and admin dashboard workflows.

---

## 🛠️ Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **AI / Agent Framework**: [Pydantic AI](https://ai.pydantic.dev/) with NVIDIA NIM OpenAI-compatible API
- **Models**: `nvidia/nemotron-3.5-bolt-e4b` (classifier) & `mistralai/mistral-large-4-1t-a52b` (support agent)
- **Database**: PostgreSQL with [psycopg3](https://www.psycopg.org/psycopg3/) (Supabase)
- **Configuration & Validation**: [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- **Email Integration**: Google APIs (`google-api-python-client`, `google-auth`)
- **Package Manager**: [uv](https://github.com/astral-sh/uv) (Python 3.13+)

---

## 📁 Project Structure

```text
ai-customer-support/
├── app/
│   ├── __init__.py
│   ├── ai/                   # AI agent logic, classification & decision engine
│   │   ├── __init__.py
│   │   ├── agent.py          # Knowledge-grounded support agent with tool calling
│   │   ├── classifier.py     # Fast ticket classifier & triage agent
│   │   ├── decide.py         # Deterministic pipeline decision engine
│   │   ├── rules.py          # Domain-specific business logic & issue routing rules
│   │   └── schemas.py        # Pydantic schemas for classification, issues & replies
│   ├── config.py             # Application settings via Pydantic BaseSettings & NVIDIA provider
│   ├── db.py                 # PostgreSQL database client, event claims & ticket operations
│   ├── gmail.py              # Gmail API client, thread parsing, label management & replies
│   ├── guards.py             # Safeguards against self-replies, automated bots & bulk mail
│   ├── main.py               # FastAPI application entrypoint & health endpoints
│   ├── pipeline.py           # Message processing pipeline and workflow dispatcher
│   └── poller.py             # Background polling loop monitoring incoming emails
├── evals/                    # Automated evaluation dataset and evaluation runner
│   ├── golden_emails.py      # Benchmark dataset of golden email interactions
│   └── run_evals.py          # Concurrent evaluation runner with assertion evaluators
├── knowledge_base/           # Domain policies, brand tone, FAQs & escalation docs
├── playground/               # Interactive test scripts for agent pipelines
├── scripts/
│   ├── get_refresh_token.py  # OAuth helper to generate Google refresh token
│   ├── gmail_check.py        # Diagnostic script to test Gmail connection & reply flow
│   ├── seed_knowledge_base.py # Ingests markdown files into PostgreSQL knowledge_base table
│   └── test_nvidia.py        # Smoke test for NVIDIA NIM model endpoints
├── supabase/
│   ├── config.toml           # Supabase CLI configuration
│   └── migrations/           # Database schema migrations (events, tickets, messages, KB)
├── .env.example          # Template for environment configuration
├── .gitignore            # Git exclusion rules
├── .python-version       # Python version specification
├── pyproject.toml        # Project dependencies and tool configurations
├── uv.lock               # Dependency lockfile
└── README.md             # Project documentation
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Python 3.13+ installed
- [uv](https://docs.astral.sh/uv/) package manager

### 2. Environment Configuration
Copy the template and fill in your credentials:
```bash
cp .env.example .env
```

Key environment variables:
- `NVIDIA_API_KEY`: Your NVIDIA NIM API key (`nvapi-...`)
- `DATABASE_URL`: PostgreSQL connection string (Supabase)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`: Google OAuth credentials
- `CLASSIFIER_MODEL`: e.g. `nvidia/nemotron-3.5-bolt-e4b`
- `AGENT_MODEL`: e.g. `mistralai/mistral-large-4-1t-a52b`

### 3. Installation & Run
Install dependencies:
```bash
uv sync
```

Run development server:
```bash
uv run fastapi dev app/main.py
```
Check health endpoint at `http://localhost:8000/health`.

