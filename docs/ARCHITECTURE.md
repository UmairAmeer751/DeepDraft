# DeepDraft — Architecture (FYP-1)

**Status:** v1 — FYP-1 build (22 Nov – 14 Dec 2026)
**Owner of this file:** Zebulun (changes through a reviewed PR)
**Last updated:** 22 Nov 2026

This file describes how DeepDraft is built **now**, for FYP-1, and where FYP-2 features will plug in later. The approved proposal remains the authority for the project's objectives; this file only records implementation decisions.

---

## 1. Style: modular monolith

One FastAPI backend, one React frontend, one PostgreSQL database. Inside the backend, code is split into clear modules with one-way dependencies. No microservices, queues or cloud hosting in FYP-1.

**Why:** three beginner-to-intermediate developers, 23 days, one demo. A monolith is easier to run, debug and integrate. Clean interfaces (LLM provider, publisher) mean FYP-2 features can be swapped in without rewriting the core.

---

## 2. System overview

```mermaid
flowchart LR
  U[User / browser] --> FE[React + Tailwind<br/>frontend :5173]
  FE -->|JSON over HTTP<br/>src/services/api.js| API[FastAPI routes<br/>backend :8000/api]
  API --> SVC[Services layer]
  SVC --> REPO[Repositories]
  REPO --> DB[(PostgreSQL 16<br/>Docker)]
  SVC --> LLMI{{LLMProvider interface}}
  LLMI --> MOCK[MockProvider<br/>tests + fallback]
  LLMI --> GEM[GeminiProvider<br/>hosted LLM]
  SVC --> PUBI{{Publisher interface}}
  PUBI --> MPUB[MockPublisher<br/>simulated only]
  SCRIPTS[Dataset scripts<br/>import / clean / stats / kappa] --> DB
```

---

## 3. Layers and rules

| Layer | Folder | Does | Must not |
|---|---|---|---|
| Frontend | `frontend/src/` | Screens, forms, state, display | Hold API keys; call the backend anywhere except `services/api.js` |
| Routes | `backend/app/api/` | Validate input (Pydantic), call a service or repository, return JSON | Contain business logic or SQL; know which LLM is used |
| Schemas | `backend/app/schemas/` | Pydantic request/response models matching `API_CONTRACT.md` | Import models or services |
| Services | `backend/app/services/` | Business logic: context building, generation, format checks, scoring, export, publishing | Write raw SQL; import FastAPI request objects |
| Repositories | `backend/app/repositories/` | All database reads/writes | Contain business rules |
| Models | `backend/app/models/` | SQLAlchemy table definitions | Contain logic |
| Core | `backend/app/core/` | Settings (`.env`), DB engine/session | — |

**Dependency direction:** routes → services → repositories → models. Never the reverse.

---

## 4. Repository layout

```
DeepDraft/
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── MVP_SCOPE.md
│   ├── ARCHITECTURE.md          ← this file
│   ├── API_CONTRACT.md
│   ├── DATA_AND_API_PLAN.md
│   ├── DATA_DICTIONARY.md
│   ├── DATASET_PLAN.md
│   ├── LABEL_GUIDE.md
│   ├── SCORING_RUBRIC.md
│   ├── TEAM_WORKFLOW.md
│   ├── SPRINT_PLAN.md
│   ├── DECISIONS_LOG.md
│   ├── examples/                 # mock JSON fixtures (contract examples)
│   ├── diagrams/                 # Mermaid sources + exported PNGs
│   ├── evaluation/               # test sets, review sheets
│   ├── evidence/                 # eval outputs, stats, prompt samples
│   └── ui/                       # wireframes, screenshots
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/        config.py, db.py
│   │   ├── api/         routes_health.py, routes_brands.py, routes_campaigns.py,
│   │   │                routes_generation.py, routes_posts.py, routes_export.py,
│   │   │                routes_dataset.py
│   │   ├── schemas/     brand.py, campaign.py, generation.py, dataset.py, common.py
│   │   ├── models/      brand.py, campaign.py, generation.py, dataset.py
│   │   ├── repositories/ brand_repo.py, campaign_repo.py, generation_repo.py, dataset_repo.py
│   │   ├── services/
│   │   │   ├── llm/         base.py, mock_provider.py, gemini_provider.py, factory.py
│   │   │   ├── publishing/  base.py, mock_publisher.py
│   │   │   ├── brand_context.py
│   │   │   ├── generation_service.py
│   │   │   ├── format_rules.py
│   │   │   ├── language_detect.py
│   │   │   ├── scoring.py
│   │   │   └── export_service.py
│   │   └── prompts/     generate_v1.md
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/  Layout, PostCard, ScoreBreakdown, ErrorCard, TagInput, ...
│   │   ├── pages/       Dashboard, Brands, BrandForm, NewCampaign, Campaign, History, Annotate
│   │   ├── services/    api.js
│   │   └── mocks/       copies of docs/examples/*.json
│   └── .env.example
├── scripts/
│   ├── seed.py
│   ├── try_provider.py
│   ├── run_format_eval.py
│   └── dataset/     import_csv.py, clean.py, report_stats.py, kappa.py
├── data/            raw/, processed/   ← gitignored, never committed
├── .github/pull_request_template.md
├── .gitignore
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 5. Module ownership

| Module | Owner |
|---|---|
| `core/`, `services/llm/`, `brand_context.py`, `generation_service.py`, `format_rules.py`, `language_detect.py`, `scoring.py`, `prompts/`, `routes_generation.py`, `routes_posts.py`, `routes_health.py` | Zebulun |
| `frontend/**` (except `pages/AnnotatePage.jsx`), `export_service.py`, `routes_export.py`, `services/publishing/` | Umair |
| `docker-compose.yml`, `models/`, `alembic/`, `repositories/`, `routes_brands.py`, `routes_campaigns.py`, `routes_dataset.py`, `scripts/seed.py`, `scripts/dataset/`, `pages/AnnotatePage.jsx` | Sohaib |
| `docs/API_CONTRACT.md`, `schemas/`, `.env.example`, `README.md` | Shared — PR reviewed by all |

---

## 6. Key interfaces

### 6.1 LLM provider

```python
class ProviderError(Exception):
    # code: timeout | rate_limited | auth_failed | invalid_response | unavailable
    def __init__(self, code: str, message: str): ...

class LLMProvider(Protocol):
    name: str
    model: str
    def generate(self, prompt: str, response_schema: dict) -> str: ...
```

- `factory.get_provider()` picks the implementation from `LLM_PROVIDER` in `.env` (`mock` | `gemini`).
- **MockProvider:** deterministic output for every platform × language mode; `MOCK_FAIL=<code>` simulates errors. All automated tests use it.
- Prompt convention: every generation prompt contains the lines `PLATFORMS: ...`, `LANGUAGE_MODE: ...` and `CTA: ...`. The mock reads them; generate_v1.md (Z5) must include them.
- **GeminiProvider:** hosted model for FYP-1. Model id comes from `LLM_MODEL`; recorded per run.
- **FYP-2:** a `LlamaLoraProvider` (LLaMA 3 8B + QLoRA adapter) implements the same interface. Nothing else changes.

### 6.2 Publisher

```python
class Publisher(Protocol):
    name: str
    def publish(self, post_id: int, platform: str, text: str) -> PublishResult: ...
# PublishResult.status: "simulated" | "failed"
```

- FYP-1: `MockPublisher` only. Never contacts a platform. Results are labelled **SIMULATED** in the UI.
- FYP-2: `BufferPublisher` or native adapters, only after access is verified and approved.

### 6.3 Image generation (reserved, FYP-2)

An `ImageProvider` interface will sit beside `LLMProvider` in `services/`. Not created in FYP-1.

---

## 7. Main flow: generate a campaign

```mermaid
sequenceDiagram
  actor U as User
  participant FE as React UI
  participant API as FastAPI
  participant GS as GenerationService
  participant LLM as LLMProvider
  participant DB as PostgreSQL
  U->>FE: Click Generate
  FE->>API: POST /api/campaigns/{id}/generate
  API->>GS: generate(campaign_id, language_mode)
  GS->>DB: load campaign, brand, example posts
  GS->>GS: build brand context + prompt (generate_v1)
  GS->>LLM: generate(prompt, schema)
  LLM-->>GS: JSON posts (or ProviderError)
  GS->>GS: validate, format checks, retry failed platform once
  GS->>GS: language detection + score v0
  GS->>DB: save generation_run + generated_posts
  API-->>FE: GenerationRun JSON
  FE-->>U: three cards with checks and experimental score
```

**Failure path:** a `ProviderError` is caught, the run is saved with `status: failed` and the error code/message, and the API returns 502 with the error body. The UI shows the message and a Retry button.

### Generation pipeline steps

1. **Load** campaign, brand, examples (repositories).
2. **Build context** (`brand_context.py`): brand fields, prohibited phrases, ≤5 examples (same platform first, ≤600 chars each), brief, platform rules, language instruction.
3. **Prompt** from `prompts/generate_v1.md`; `PROMPT_VERSION` stored on the run. Prompts are never edited after an evaluation — a new version file is created.
4. **Call provider** once for all selected platforms, JSON response with schema, timeout from `LLM_TIMEOUT_SECONDS`.
5. **Validate** with Pydantic.
6. **Format checks** (`format_rules.py`); retry only a failing platform once; still failing → `partial`.
7. **Language detection** (`language_detect.py`) and **score v0** (`scoring.py`).
8. **Save** run and posts; return.

---

## 8. Data model (summary)

Full column list: `docs/DATA_DICTIONARY.md` (Sohaib).

```mermaid
erDiagram
  brands ||--o{ brand_examples : has
  brands ||--o{ campaigns : has
  campaigns ||--o{ generation_runs : has
  generation_runs ||--o{ generated_posts : produces
  generated_posts ||--o{ post_revisions : keeps
  dataset_sources ||--o{ dataset_posts : provides
  dataset_posts ||--o{ annotations : receives
```

The product tables (top five) and the research dataset tables (bottom three) share one database but are not linked; the dataset is research data, not app data.

---

## 9. Consistency score v0 (summary)

Deterministic rubric, 0–100, always labelled `experimental`. Full definition: `docs/SCORING_RUBRIC.md`.

| Dimension | Max |
|---|---|
| Prohibited phrases absent | 20 |
| Platform format compliance | 20 |
| Language mode match | 15 |
| Brief coverage (CTA + key message) | 15 |
| Style similarity to brand examples (TF-IDF char 3–5-grams, cosine) | 30 |

It measures rule compliance and wording overlap, not validated brand voice. Validation against ≥200 human-labelled samples is FYP-2.

---

## 10. Configuration and secrets

| Variable | File | Example |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | root `.env` | `deepdraft` / `change_me_locally` / `deepdraft` |
| `DATABASE_URL` | `backend/.env` | `postgresql+psycopg://deepdraft:change_me_locally@localhost:5432/deepdraft` |
| `DATABASE_URL_TEST` | `backend/.env` | `...@localhost:5432/deepdraft_test` |
| `LLM_PROVIDER` | `backend/.env` | `mock` or `gemini` |
| `LLM_MODEL` | `backend/.env` | current model id from Google AI Studio |
| `LLM_API_KEY` | `backend/.env` | **never committed** |
| `LLM_TIMEOUT_SECONDS` | `backend/.env` | `30` |
| `MOCK_FAIL` | `backend/.env` | empty, or `timeout` / `rate_limited` for testing |
| `CORS_ORIGINS` | `backend/.env` | `http://localhost:5173` |
| `VITE_API_BASE_URL` | `frontend/.env` | `http://localhost:8000/api` |
| `VITE_USE_MOCK` | `frontend/.env` | `true` until backend routes are merged |

Only `.env.example` files (variable names, no real values) are committed. `.env` is in `.gitignore`. Free-tier LLM use is limited to fictional demo brands and test briefs.

---

## 11. Testing approach

| Level | Tool | Owner |
|---|---|---|
| Backend unit + API tests | pytest + httpx TestClient, `LLM_PROVIDER=mock`, separate test DB | Zebulun, Sohaib, Umair (export) |
| Contract fixtures | Test validating `docs/examples/*.json` against schemas | Zebulun |
| Frontend components | Vitest + React Testing Library (2–4 tests) | Umair |
| Manual UI regression | Checklist F1–F15 in Chrome and Edge | Umair |
| Pilot evaluation | `scripts/run_format_eval.py` (~90 posts), human review sheet (30 posts) | Zebulun, Sohaib |
| Dataset quality | Dedup tests, stats report, Cohen's Kappa on a double-labelled subset | Sohaib |

Automated tests never call a real API.

---

## 12. Deferred to FYP-2 (still in the proposal)

| Item | Plugs in at |
|---|---|
| LLaMA 3 (8B) + LoRA/QLoRA brand voice | New `LLMProvider` implementation; GPU option to be verified |
| DALL-E 3 images + CLIP pairing | New `ImageProvider` interface |
| Carousel PNG export | New service + export format |
| Hashtag optimisation | New service; data source to be verified |
| Virality predictor | Trained on the dataset tables; separate service |
| Crisis detection | Separate monitoring service |
| Content repurposing | New service reusing `GenerationService` |
| Real publishing, scheduling, analytics | `Publisher` adapters; Celery + Redis only when needed |
| Login and multi-client agency roles | Auth layer in front of routes |
| pgvector, AWS S3, AWS EC2 hosting | Added only when a feature needs them |

---

## 13. Decisions recorded

See `docs/DECISIONS_LOG.md` for the full log. Architecture-relevant entries:

- **D-001** Compressed FYP-1 schedule (22 Nov – 14 Dec 2026).
- **D-002** Hosted LLM behind `LLMProvider` in FYP-1; LLaMA 3 (8B) + QLoRA in FYP-2 — *pending supervisor confirmation*.
- **D-003** FYP-1 scope table (see the team guides).
