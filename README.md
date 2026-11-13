# 🤖 AI Customer Support System

[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.162%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Pydantic AI](https://img.shields.io/badge/Pydantic_AI-v2.68%2B-E92063.svg)](https://ai.pydantic.dev/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA_NIM-Nemotron_%26_Mistral-76B900.svg?logo=nvidia&logoColor=white)](https://build.nvidia.com)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_/_Supabase-336791.svg?logo=postgresql&logoColor=white)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Multi--stage_Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

An end-to-end, multi-agent AI customer support automation platform for e-commerce stores (such as Amazon brand stores). The system continuously monitors an official Gmail inbox, triages customer requests, retrieves grounded domain facts from a PostgreSQL knowledge base via tool-calling LLMs, generates context-aware resolutions, dispatches threaded email replies, flags human escalations, and serves a web dashboard.

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [End-to-End Processing Lifecycle](#-end-to-end-processing-lifecycle)
- [Database Schema & Architecture](#-database-schema--architecture)
- [State Machine & Ticket Lifecycle](#-state-machine--ticket-lifecycle)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Directory Structure](#-directory-structure)
- [Prerequisites](#-prerequisites)
- [Step-by-Step Setup Guide](#-step-by-step-setup-guide)
  - [1. Google Cloud & Gmail API Configuration](#1-google-cloud--gmail-api-configuration)
  - [2. Supabase PostgreSQL Database Setup](#2-supabase-postgresql-database-setup)
  - [3. NVIDIA NIM Free Model Setup](#3-nvidia-nim-free-model-setup)
  - [4. Environment Variables (`.env`)](#4-environment-variables-env)
- [Running the Application](#-running-the-application)
  - [Local Development (3 Terminals)](#local-development-3-terminals)
  - [Docker & Docker Compose](#docker--docker-compose)
- [Admin Web Dashboard](#-admin-web-dashboard)
- [Automated Evaluation Suite (`evals/`)](#-automated-evaluation-suite-evals)
- [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph External["External Services and Users"]
        Customer["Customer - Email Inquirer"]
        GmailAPI["Google Gmail API"]
        NvidiaNIM["NVIDIA NIM - Nemotron and Mistral Large"]
        SupabaseDB["Supabase PostgreSQL Cloud DB"]
        SupportStaff["Human Support Team"]
    end
    subgraph Ingestion["Ingestion and API Layer"]
        Poller["Poller Service - app/poller.py"]
        GmailClient["Gmail Client - app/gmail.py"]
        Guards["Guardrails Filter - app/guards.py"]
        FastAPIApp["FastAPI REST Backend - app/main.py"]
    end
    subgraph Engine["AI Decision Engine - Pydantic AI"]
        Decide["Decision Orchestrator - app/ai/decide.py"]
        Classifier["Classifier Agent - nemotron-3.5-bolt-e4b"]
        SupportAgent["Support Agent - mistral-large-4-1t-a52b"]
        Rules["Business Rules - app/ai/rules.py"]
    end
    subgraph Data["Persistence and Dashboard"]
        DB["Database Layer - app/db.py"]
        Dashboard["React Admin Dashboard"]
    end
    Customer -->|Sends inquiry| GmailAPI
    GmailAPI -->|Polls unread emails| GmailClient
    GmailClient --> Poller
    Poller --> Guards
    Guards -->|Valid customer message| Decide
    Decide --> Classifier
    Classifier -->|Inference request| NvidiaNIM
    Decide --> SupportAgent
    SupportAgent -->|Inference request| NvidiaNIM
    SupportAgent -->|SQL Tool: get_section| DB
    Decide --> Rules
    Poller --> DB
    DB --> SupabaseDB
    FastAPIApp --> DB
    FastAPIApp --> Dashboard
    SupportStaff --> Dashboard
    GmailClient -->|Sends threaded reply| GmailAPI
    GmailAPI -->|Delivers response| Customer
```

---

## 🔄 End-to-End Processing Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    participant Gmail as Gmail API
    participant Poller as Background Poller
    participant Guards as Guardrails Filter
    participant DB as PostgreSQL Database
    participant Classifier as Nemotron Classifier
    participant Agent as Mistral Large Agent
    participant Rules as Python Business Rules
    Poller->>Gmail: List unread messages
    Gmail-->>Poller: Return message IDs
    loop Each Inbound Message
        Poller->>DB: Claim message event lock
        alt Message already processed
            DB-->>Poller: Return None
        else Message lock acquired
            DB-->>Poller: Return event ID and attempt count
            Poller->>Gmail: Fetch message and full thread
            Gmail-->>Poller: Return email headers and body
            Poller->>Guards: Check loop and bot headers
            alt Self-sent, auto-reply, or bulk email
                Guards-->>Poller: Return skip reason
                Poller->>DB: Mark event as skipped
                Poller->>Gmail: Add ai-processed label
            else Valid customer email
                Guards-->>Poller: Allow message
                Poller->>DB: Upsert ticket and save inbound message
                alt Thread already escalated
                    Poller->>DB: Mark event skipped - thread escalated
                else Standard processing
                    Poller->>Classifier: Triage category and language
                    Classifier-->>Poller: Return classification result
                    alt Needs human review
                        Poller->>Gmail: Send acknowledgment reply
                        Poller->>Gmail: Add needs-human label
                        Poller->>DB: Mark ticket as escalated
                    else Autonomous answer
                        Poller->>Agent: Request grounded support reply
                        Agent->>DB: Fetch brand tone and escalation rules
                        DB-->>Agent: Return policy documentation
                        Agent->>DB: Fetch product knowledge section
                        DB-->>Agent: Return product details and specs
                        Agent-->>Poller: Return reply and structured issue data
                        Poller->>Rules: Determine next step for reported issue
                        Rules-->>Poller: Return action resolution
                        alt Replacement or exchange required
                            Poller->>Gmail: Send notification reply
                            Poller->>Gmail: Add needs-human label
                            Poller->>DB: Mark ticket escalated with proposed action
                        else Direct inquiry answer
                            Poller->>Gmail: Send threaded email reply
                            Poller->>DB: Mark ticket as answered
                        end
                        Poller->>DB: Save outbound message
                        Poller->>Gmail: Add ai-processed label
                        Poller->>DB: Mark event as processed
                    end
                end
            end
        end
    end
```

---

## 🗄️ Database Schema & Architecture

The database is built on PostgreSQL (hosted via Supabase) with Row Level Security (RLS) enabled on all tables:

```mermaid
erDiagram
    TICKETS ||--o{ MESSAGES : contains
    TICKETS {
        bigint id PK
        string gmail_thread_id UK
        string customer_email
        string subject
        string category
        string status
        string proposed_action
        timestamptz created_at
        timestamptz updated_at
    }
    MESSAGES {
        bigint id PK
        bigint ticket_id FK
        string gmail_message_id UK
        string direction
        string from_address
        string body
        timestamptz created_at
    }
    EVENTS {
        bigint id PK
        string gmail_message_id UK
        string status
        int attempts
        string error
        jsonb result
        timestamptz created_at
        timestamptz processed_at
    }
    KNOWLEDGE_BASE {
        bigint id PK
        string section
        string title
        string content
        timestamptz updated_at
    }
```

---

## 🔁 State Machine & Ticket Lifecycle

```mermaid
stateDiagram-v2
    [*] --> InboundEmail: New message in Gmail inbox
    InboundEmail --> Deduplication: Claim message lock in DB
    Deduplication --> Skipped: Duplicate or already claimed
    Deduplication --> Guardrails: Lock acquired
    Guardrails --> Skipped: Self-sent, auto-reply, or bulk list
    Guardrails --> Classifier: Passes all safety filters
    Classifier --> Escalated: Needs human review
    Classifier --> Agent: Valid product or support inquiry
    Agent --> Answered: Knowledge base resolves question
    Agent --> Escalated: Colleague action required
    Answered --> Closed: Customer issue resolved
    Escalated --> Closed: Human agent handles thread
    Skipped --> [*]
    Closed --> [*]
```

---

## ✨ Key Features

- **Multi-Agent Decision Architecture**:
  - **Triage Classifier (`nemotron-3.5-bolt-e4b`)**: Ultra-fast intent classification, language detection, and policy violation detection.
  - **Support Agent (`mistralai/mistral-large-4-1t-a52b`)**: 123B parameter model utilizing tool-calling to fetch exact documentation chunks before drafting responses.
- **Deterministic Python Guardrails & Business Rules**:
  - Automatically avoids infinite email reply loops (`Auto-Submitted`, `Precedence: bulk/list`, matching own email).
  - Enforces parts limits (e.g., `<= 2` damaged panels = ship panels; `>= 3` = full replacement).
  - Restricts AI promises: flags replies that inadvertently promise unapproved refunds or delivery dates.
- **Zero-Hallucination Knowledge Retrieval**:
  - Domain documentation (`knowledge_base/`) is stored in PostgreSQL and injected dynamically into context via `@support_agent.tool_plain` calls.
- **Native Gmail Threading**:
  - Strips quoted email noise (`On ... wrote:` / `> ...`).
  - Preserves native email threading using standard `In-Reply-To` and `References` RFC headers.
  - Automatically applies Gmail labels: `ai-processed` and `needs-human`.
- **Modern Full-Stack Dashboard**:
  - Built with React 19, Vite, Tailwind CSS v4, and shadcn/ui.
  - Real-time ticket inspection, message history viewer, event processing audit trail, and in-browser knowledge base markdown editor.
  - Secured via HTTP Basic Authentication (`secrets.compare_digest`).
- **Comprehensive Evaluation Benchmark (`evals/`)**:
  - Built with `pydantic-evals`.
  - 18 golden test scenarios verifying classification, routing, and escalation behaviors.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) | High-performance asynchronous API framework |
| **Agent Framework** | [Pydantic AI](https://ai.pydantic.dev/) | Structured agent framework with Pydantic validation |
| **Inference Provider** | [NVIDIA NIM](https://build.nvidia.com) | OpenAI-compatible serverless inference endpoint |
| **Classifier Model** | `nvidia/nemotron-3.5-bolt-e4b` | Ultra-fast ticket classifier & triage model |
| **Support Agent Model** | `mistralai/mistral-large-4-1t-a52b`| Deep reasoning model with native tool-calling |
| **Database** | [PostgreSQL (Supabase)](https://supabase.com) | Relational database with Row Level Security |
| **Database Driver** | [psycopg3](https://www.psycopg.org/psycopg3/) | Fast Python PostgreSQL driver with JSONB support |
| **Email Integration** | [Google APIs](https://developers.google.com/gmail/api) | Official Google API Python Client & OAuth2 libraries |
| **Frontend UI** | [React 19](https://react.dev/) + [Vite](https://vite.dev/) | Modern client SPA for customer support admin |
| **Styling & Components** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Accessible, customizable component system |
| **Evaluation Framework**| [pydantic-evals](https://github.com/pydantic/pydantic-evals) | Automated testing framework for AI outputs |
| **Package Management** | [uv](https://docs.astral.sh/uv/) | Extremely fast Python package and virtualenv manager |
| **Containerization** | [Docker](https://www.docker.com/) & Docker Compose | Multi-stage production container deployment |

---

## 📁 Directory Structure

```text
ai-customer-support/
├── app/
│   ├── __init__.py
│   ├── ai/                             # Multi-agent decision & reasoning engine
│   │   ├── __init__.py
│   │   ├── agent.py                    # Knowledge-grounded agent with SQL tool calling
│   │   ├── classifier.py               # Fast triage classifier (section & language)
│   │   ├── decide.py                   # Deterministic decision orchestrator
│   │   ├── rules.py                    # Domain policy & issue resolution rules
│   │   └── schemas.py                  # Pydantic schemas (Classification, Issue, Decision)
│   ├── config.py                       # App settings & NVIDIA OpenAIProvider setup
│   ├── db.py                           # PostgreSQL connection & query operations
│   ├── gmail.py                        # Gmail API client, labeler & thread formatter
│   ├── guards.py                       # Guardrails against loops, bots & bulk mail
│   ├── main.py                         # FastAPI REST application & dashboard static host
│   ├── pipeline.py                     # Message intake & workflow dispatcher
│   └── poller.py                       # Continuous background email polling service
├── dashboard/                          # React + Vite + Tailwind CSS v4 admin dashboard
│   ├── src/
│   │   ├── components/ui/              # shadcn/ui components (button, card, table, etc.)
│   │   ├── pages/                      # Views: tickets, events, knowledge-base, login
│   │   ├── lib/api.ts                  # Authenticated REST API client
│   │   ├── App.tsx                     # Main layout & navigation tabs
│   │   └── main.tsx                    # React application entrypoint
│   ├── package.json
│   └── vite.config.ts
├── evals/                              # Benchmark evaluation test suite
│   ├── golden_emails.py                # 18 curated benchmark email scenarios
│   └── run_evals.py                    # Concurrent async evaluation runner
├── knowledge_base/                     # Domain markdown documentation (policies & specs)
│   ├── brand-and-tone.md               # Communication style & brand voice rules
│   ├── escalation-rules.md             # Criteria for human agent routing
│   ├── paddle-boards.md                # Specifications, sizing & leak troubleshooting
│   ├── returns-and-warranty.md         # Return windows & warranty terms
│   ├── shelving.md                     # Bookcases, parts list, hardware & finishes
│   └── shipping.md                     # Delivery timeframes & warehouse shipping rules
├── playground/                         # Diagnostic test scripts
│   └── try_pipeline.py                 # Interactive single-prompt pipeline simulator
├── scripts/                            # Operational & setup automation scripts
│   ├── get_refresh_token.py            # Local OAuth flow to generate Google refresh token
│   ├── gmail_check.py                  # Test Gmail authentication & send diagnostic reply
│   ├── seed_knowledge_base.py          # Ingest markdown files into PostgreSQL
│   └── test_nvidia.py                  # Smoke test for NVIDIA NIM model endpoints
├── supabase/                           # Database schema & migrations
│   ├── config.toml                     # Supabase CLI configuration
│   └── migrations/
│       └── 20261112130453_create_tables.sql # Tables: events, tickets, messages, KB
├── .dockerignore                       # Docker build context exclusion list
├── .env.example                        # Template for environment configuration
├── .gitignore                          # Git exclusion rules
├── .python-version                     # Pinned Python version (3.13)
├── docker-compose.yml                  # Production Compose file (API + Poller)
├── Dockerfile                          # Multi-stage Docker build (Node.js + Python)
├── pyproject.toml                      # Project metadata & Python dependencies
└── uv.lock                             # Hermetic dependency lockfile
```

---

## 📋 Prerequisites

Before setting up the project, make sure you have the following installed:
- [Python 3.13+](https://www.python.org/downloads/)
- [uv](https://docs.astral.sh/uv/) package manager:
  ```powershell
  irm https://astral.sh/uv/install.ps1 | iex
  ```
- [Node.js 20+](https://nodejs.org/) & `npm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (optional, for container deployment)
- A dedicated Gmail account (for customer support inbox testing)
- A free account on [Supabase](https://supabase.com/)
- A free account on [NVIDIA NIM](https://build.nvidia.com/)

---

## 🚀 Step-by-Step Setup Guide

### 1. Google Cloud & Gmail API Configuration

To enable the bot to read, label, and reply to emails, you need an authorized OAuth 2.0 Desktop client.

1. **Create a Google Cloud Project**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Click the project dropdown at the top and select **New Project**.
   - Name it `ai-customer-support` and click **Create**.
2. **Enable the Gmail API**:
   - Navigate to **APIs & Services** > **Library**.
   - Search for `Gmail API`, select it, and click **Enable**.
3. **Configure the OAuth Consent Screen**:
   - Navigate to **APIs & Services** > **OAuth consent screen**.
   - Select **External** and click **Create**.
   - Fill in:
     - **App name**: `AI Customer Support`
     - **User support email**: your Gmail address
     - **Developer contact email**: your email
   - Under **Scopes**, click **Add or Remove Scopes**, add `https://www.googleapis.com/auth/gmail.modify`, and save.
   - Under **Test Users**, click **+ Add Users** and enter the exact Gmail address you will use for testing.
4. **Create OAuth Client Credentials**:
   - Navigate to **APIs & Services** > **Credentials**.
   - Click **+ Create Credentials** > **OAuth client ID**.
   - Choose **Application type**: `Desktop app`.
   - Name it `Customer Support Desktop Client` and click **Create**.
   - Click **Download JSON** on the dialog and save the file in your project root as:
     ```text
     credentials.json
     ```
5. **Generate the Google Refresh Token**:
   - Run the included token extractor script:
     ```powershell
     uv run python scripts/get_refresh_token.py
     ```
   - A browser window will open asking you to sign in with your Google account. Click **Advanced** > **Go to AI Customer Support (unsafe)** and grant permissions.
   - The terminal will print:
     ```text
     GOOGLE_CLIENT_ID=...apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=GOCSPX-...
     GOOGLE_REFRESH_TOKEN=1//...
     ```
   - Copy these 3 values into your `.env` file. You can now safely delete `credentials.json` (it is also ignored in `.gitignore`).
6. **Verify the Gmail Connection**:
   - Send a test email to your Gmail account from another address.
   - Run:
     ```powershell
     uv run python scripts/gmail_check.py
     ```
   - It will connect, display your profile email, list the latest message, and send an automated test reply.

---

### 2. Supabase PostgreSQL Database Setup

1. **Create a Supabase Project**:
   - Log into [Supabase](https://supabase.com/) and click **New project**.
   - Name your project (e.g. `ai-customer-support`) and choose a strong database password.
2. **Get your Database Connection String**:
   - In Supabase, go to **Project Settings** > **Database** > **Connection string**.
   - Select **URI** (or Transaction Pooler on port `6543`/`5432`).
   - Fill in your database password and copy the string into `.env` as `DATABASE_URL`:
     ```env
     DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
     ```
3. **Push Schema Migrations**:
   - Using the Supabase CLI:
     ```powershell
     supabase link --project-ref <your-project-ref>
     supabase db push --remote
     ```
   - This executes [`supabase/migrations/20261112130453_create_tables.sql`](file:///d:/Projects/Agents/ai-customer-support/supabase/migrations/20261112130453_create_tables.sql) to create `events`, `tickets`, `messages`, and `knowledge_base` with Row Level Security.
4. **Seed the Knowledge Base**:
   - Ingest all markdown files in `knowledge_base/` directly into PostgreSQL:
     ```powershell
     uv run python scripts/seed_knowledge_base.py
     ```
   - You will see:
     ```text
     brand-and-tone: 4 entries
     escalation-rules: 3 entries
     paddle-boards: 5 entries
     returns-and-warranty: 4 entries
     shelving: 4 entries
     shipping: 3 entries
     ```

---

### 3. NVIDIA NIM Free Model Setup

This project uses free, high-performance models hosted on NVIDIA's serverless infrastructure:

1. Visit [build.nvidia.com](https://build.nvidia.com/) and create a free account (no credit card required).
2. Browse to any model (e.g., [Mistral Large](https://build.nvidia.com/mistralai/mistral-large-2407)) and click **Get API Key**.
3. Copy the key starting with `nvapi-...` into your `.env`:
   ```env
   NVIDIA_API_KEY=nvapi-...
   ```
4. Verify the models with the diagnostic smoke test:
   ```powershell
   uv run python scripts/test_nvidia.py
   ```
   Output:
   ```text
   === Test 1: Classifier model (Nemotron) ===
   Category: Repair/Maintenance
   Urgent: True
   ✅ Classifier model works!

   === Test 2: Agent model (Mistral Large) ===
   Response: Hello from NVIDIA NIM!
   ✅ Agent model works!

   🎉 Both NVIDIA NIM models are working!
   ```

---

### 4. Environment Variables (`.env`)

Create your `.env` file in the project root:

```bash
cp .env.example .env
```

Configure the following variables:

| Variable | Description | Example / Default |
|---|---|---|
| `GOOGLE_CLIENT_ID` | OAuth2 Client ID from Google Cloud Console | `123456...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret from Google Cloud Console | `GOCSPX-...` |
| `GOOGLE_REFRESH_TOKEN` | Offline access refresh token from OAuth flow | `1//0gg...` |
| `DATABASE_URL` | PostgreSQL connection URI (Supabase pooler) | `postgresql://postgres...` |
| `NVIDIA_API_KEY` | Serverless API Key from build.nvidia.com | `nvapi-...` |
| `CLASSIFIER_MODEL` | Lightweight model for classification & triage | `nvidia/nemotron-3.5-bolt-e4b` |
| `AGENT_MODEL` | Reasoning model with tool-calling support | `mistralai/mistral-large-4-1t-a52b` |
| `POLL_INTERVAL_SECONDS` | Seconds between inbox scans | `30` |
| `DASHBOARD_USERNAME` | Username for dashboard HTTP Basic Auth | `admin` |
| `DASHBOARD_PASSWORD` | Secure password for dashboard login | `SuperSecretPassword123` |
| `PYDANTIC_AI_NO_BANNER`| Suppress Pydantic AI startup banner | `1` |

---

## 🏃 Running the Application

### Local Development (3 Terminals)

For an active development workflow with hot reloading:

#### Terminal 1: FastAPI Backend
```powershell
uv run fastapi dev app/main.py
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

#### Terminal 2: Continuous Background Poller
```powershell
uv run watchfiles "python -m app.poller" app .env
```
*(Monitors inbox every 30 seconds and automatically restarts when `app/` or `.env` changes).*

#### Terminal 3: React Admin Dashboard
```powershell
cd dashboard
npm run dev
```
- Dashboard UI: [http://localhost:5173](http://localhost:5173)

---

### Docker & Docker Compose

Deploy the entire stack (FastAPI backend + background email poller + compiled React dashboard) in production containers:

```bash
docker compose up --build
```

- **FastAPI & Embedded Dashboard**: [http://localhost:8080](http://localhost:8080)
- **Health Check**: [http://localhost:8080/health](http://localhost:8080/health)
- **Background Poller**: Running as an isolated, containerized daemon with automatic restart policies and log rotation (`max-size: 10m`).

To run in the background (detached):
```bash
docker compose up -d
```
To view live container logs:
```bash
docker compose logs -f
```

---

## 🖥️ Admin Web Dashboard

The web dashboard is a modern interface providing full observability into support operations:

1. **Authentication**: Secured with HTTP Basic Auth matching `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD`.
2. **Tickets Management (`/tickets`)**:
   - Filter tickets by status: `all`, `open`, `answered`, or `escalated`.
   - View customer email, thread subject, category badge, and proposed actions (e.g., `exchange`, `ship-panels`).
   - Inspect full conversation message history (inbound customer queries vs outbound AI responses).
3. **Events Audit Log (`/events`)**:
   - Inspect every claimed Gmail message.
   - View real-time status: `processing`, `processed`, `skipped`, or `failed`.
   - Inspect attempt counts, error traces, and the full JSON decision payload returned by the AI engine.
4. **Knowledge Base Live Editor (`/knowledge-base`)**:
   - Browse documentation organized by section (`paddle-boards`, `shelving`, `shipping`, etc.).
   - Edit titles and content in real-time. Changes are instantly saved to PostgreSQL and immediately reflected in agent tool calls without restarting any servers.
5. **Instant Sync**:
   - Click the **Poll Now** button in the navigation header to trigger an on-demand inbox scan via `/api/poll`.

---

## 🧪 Automated Evaluation Suite (`evals/`)

The repository includes a benchmark evaluation framework powered by `pydantic-evals`:

```powershell
uv run python -m evals.run_evals
```

### What It Tests:
- **18 Golden Email Scenarios** in [`evals/golden_emails.py`](file:///d:/Projects/Agents/ai-customer-support/evals/golden_emails.py):
  - **Sizing Inquiries**: 90kg rider recommendation, German language queries (`Hallo, ich wiege 70 kg...`).
  - **Missing Accessories**: Missing pump with order number (escalate) vs without order number (ask for details).
  - **Product Defects**: Slow leak before valve check vs after valve check, seam splits, cracked panels.
  - **Wrong Finish**: Ordered walnut, received white (routes to `shelving` with action `escalate`, proposed `exchange`).
  - **Assembly Questions**: Finished vs unfinished side of bookcase back panels.
  - **Policy & Returns**: Returning third-party products (garden lamp via Amazon), angry refund demands.
  - **Adversarial Inputs**: Prompt injection attempts (`Ignore all previous instructions...`), off-topic queries (gift cards).
- **Evaluators**:
  - `SectionMatches`: Verifies the model routes to the exact target domain.
  - `ActionMatches`: Verifies whether the email should be answered autonomously (`reply`) or routed to human staff (`escalate`).
  - **Resilience**: Features automatic async connection retry logic to ensure 100% test completion even under network hiccups.

---

## ❓ Troubleshooting & FAQ

### 1. `mkdir : A positional parameter cannot be found that accepts argument 'scripts'`
In Windows PowerShell, `mkdir` requires commas between folder names:
```powershell
mkdir app, scripts
```

### 2. `touch : The term 'touch' is not recognized`
`touch` is a Unix command. In PowerShell, create empty files with:
```powershell
New-Item app/__init__.py
# or using short alias:
ni app/__init__.py
```

### 3. `ModuleNotFoundError: No module named 'dotenv'` when running watchfiles
On Windows, `watchfiles` runs command targets in a fresh subshell. Run with `uv run` inside the quotes:
```powershell
uv run watchfiles "uv run python -m app.poller" app .env
```
Or run the function target directly:
```powershell
uv run watchfiles app.poller.main app .env
```

### 4. `Error: Cannot find module 'tslib'` in the Dashboard
If npm dedupes `tslib` into a nested path, install it at the top level:
```powershell
cd dashboard
npm install --save tslib
```

### 5. `dial error (connect ECONNREFUSED 127.0.0.1:54322)` on `supabase db push`
By default, `supabase db push` targets a local Docker database. To push to your linked cloud database, pass `--remote`:
```powershell
supabase db push --remote
```

### 6. Gmail Token Refresh
If you receive `google.auth.exceptions.RefreshError`, re-run:
```powershell
uv run python scripts/get_refresh_token.py
```
and replace `GOOGLE_REFRESH_TOKEN` in your `.env`.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
