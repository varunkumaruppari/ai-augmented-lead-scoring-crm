# Architecture & Processing Flow Diagrams
**Lohithadharma Lead Scoring Dashboard**

This document visualizes the system's architecture, database schemas, deployment pipelines, and core processes using Mermaid diagrams.

---

## 1. System Architecture

Shows the end-to-end component setup, client communication, and service boundaries.

```mermaid
graph TD
    User([Browser Client])
    Vite[Vite React Frontend]
    Nginx[Nginx Reverse Proxy]
    Express[Express.js API Server]
    Socket[Socket.io Server]
    DB[(PostgreSQL Database)]
    AI[AI Service Provider Abstraction]
    OpenAI[OpenAI API]
    Gemini[Google Gemini API]
    Mock[Mock AI Service Fallback]

    User -->|HTTP/HTTPS| Nginx
    User -->|WebSockets| Socket
    Nginx -->|Serves Web Assets| Vite
    Nginx -->|API Requests| Express
    Express -->|Read/Write| DB
    Express <-->|Socket Events| Socket
    Express -->|AI Prompts| AI
    AI -->|OpenAI Provider| OpenAI
    AI -->|Gemini Provider| Gemini
    AI -->|Fallback Provider| Mock
```

---

## 2. Database ER Diagram

Visualizes database tables, columns, indexes, and primary/foreign key relationships.

```mermaid
erDiagram
    roles {
        uuid id PK
        varchar name UK
        text description
        timestamptz created_at
    }
    users {
        uuid id PK
        varchar email UK
        text password_hash
        varchar full_name
        varchar phone
        varchar role FK
        boolean is_active
        int failed_logins
        timestamptz locked_until
        text refresh_token
        timestamptz created_at
    }
    leads {
        uuid id PK
        varchar full_name
        varchar email
        varchar phone
        varchar source
        varchar status
        int current_score
        varchar category
        varchar budget_tier
        numeric expected_revenue
        uuid assigned_to FK
        varchar pipeline_stage
        timestamptz created_at
    }
    lead_scores {
        uuid id PK
        uuid lead_id FK
        int score
        varchar category
        int budget_score
        int urgency_score
        int questions_score
        int site_visit_score
        int engagement_score
        int response_score
        int followup_score
        timestamptz calculated_at
    }
    lead_activities {
        uuid id PK
        uuid lead_id FK
        uuid user_id FK
        varchar type
        text description
        jsonb meta
        timestamptz created_at
    }
    follow_ups {
        uuid id PK
        uuid lead_id FK
        uuid assigned_to FK
        timestamptz scheduled_at
        timestamptz completed_at
        varchar type
        varchar priority
        text notes
    }
    notifications {
        uuid id PK
        uuid user_id FK
        varchar type
        varchar title
        text message
        uuid lead_id FK
        boolean is_read
        timestamptz created_at
    }
    lead_ai_insights {
        uuid id PK
        uuid lead_id FK "Unique"
        text summary_overview
        text summary_intent
        text summary_risk
        text summary_opportunity
        jsonb outreach_followup
        jsonb outreach_email
        text outreach_whatsapp
        varchar next_action
    }
    system_settings {
        uuid id PK
        varchar key UK
        text value
        varchar category
        text description
    }
    system_metrics {
        uuid id PK
        varchar metric_name
        numeric metric_value
        jsonb tags
        timestamptz recorded_at
    }

    users ||--o{ roles : "has role"
    leads ||--o{ users : "assigned to"
    leads ||--o{ lead_scores : "score log"
    leads ||--o{ lead_activities : "activities log"
    leads ||--o{ follow_ups : "follow-up tasks"
    users ||--o{ notifications : "receives"
    leads ||--o{ lead_ai_insights : "has AI details"
```

---

## 3. Deployment Diagram

Visualizes production cloud deployment topology using Neon, Render/Railway, and Vercel.

```mermaid
graph LR
    Vercel[Vercel CDN Edge]
    Client([Client Browser])
    Render[Render/Railway API Node]
    Neon[(Neon Serverless DB)]
    AI[AI API Providers]

    Client -->|HTTPS / Static Assets| Vercel
    Client -->|REST API / WebSockets| Render
    Render -->|SQL Connection Pool| Neon
    Render -->|Secure API Requests| AI
```

---

## 4. API Request Flow

Tracing a standard request cycle (including Request IDs, helmet safety headers, sanitizers, and RBAC auth).

```mermaid
sequenceDiagram
    autonumber
    actor Client as Browser Client
    participant Express as Express.js App
    participant ReqID as RequestID Middleware
    participant Security as Helmet & RateLimiter
    participant Sanitize as Input Sanitizer
    participant Auth as Auth & RBAC Guard
    participant Controller as API Controller
    participant DB as PostgreSQL DB
    participant Audit as Audit Logger

    Client->>Express: Send POST Request /api/v1/leads
    activate Express
    Express->>ReqID: Attach correlation ID (X-Request-ID)
    ReqID->>Security: Validate Rate limits & Headers
    Security->>Sanitize: Strip scripts/XSS inputs
    Sanitize->>Auth: Validate JWT & check permissions
    Auth->>Controller: Route to controller action
    activate Controller
    Controller->>DB: Execute Parameterized SQL
    DB-->>Controller: Return Database Rows
    Controller->>Audit: Record Mutation in Logs
    Controller-->>Client: Return JSON payload + header X-Request-ID
    deactivate Controller
    deactivate Express
```

---

## 5. Authentication Sequence

Demonstrates JWT access tokens, DB refresh checks, and sliding session logic.

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client Client
    participant API as Express Auth Router
    participant DB as PostgreSQL DB

    Client->>API: POST /auth/login { email, pass }
    activate API
    API->>DB: Query user hash & role
    DB-->>API: User details
    API->>API: Verify password with bcrypt
    API->>DB: Save Refresh Token in user row
    API-->>Client: Return access_token (15m) & refresh_token (7d)
    deactivate API

    Note over Client, API: 15 minutes expire
    Client->>API: POST /auth/refresh { refresh_token }
    activate API
    API->>DB: Verify token matches user row
    DB-->>API: Valid match
    API-->>Client: Return new access_token (15m) & same refresh_token
    deactivate API
```

---

## 6. Lead Scoring Pipeline

Shows how lead profiles are weighed across 7 factors by the scoring service.

```mermaid
graph TD
    Lead[Incoming Lead Data] --> Engine[Lead Scoring Engine]
    Engine --> Budget[Budget Tier Weight: 25%]
    Engine --> Urgency[Urgency Level Weight: 20%]
    Engine --> Questions[Questions Asked Weight: 15%]
    Engine --> Visit[Site Visit Status Weight: 15%]
    Engine --> Engagement[Engagement Count Weight: 10%]
    Engine --> Response[Response Time Weight: 10%]
    Engine --> FollowUp[Followup Activity Weight: 5%]

    Budget --> Sum[Calculate Total Points 0-100]
    Urgency --> Sum
    Questions --> Sum
    Visit --> Sum
    Engagement --> Sum
    Response --> Sum
    FollowUp --> Sum

    Sum --> Classify{Score Threshold?}
    Classify -->|> 70| Hot[Classify HOT]
    Classify -->|40 - 70| Warm[Classify WARM]
    Classify -->|< 40| Cold[Classify COLD]
```

---

## 7. AI Analysis & Outreach Generation Flow

Visualizes how AI summaries and outreach messages are created and served.

```mermaid
graph TD
    Lead[Lead & Activities Data] --> Prompt[Generate Structured Prompt]
    Prompt --> ProviderCheck{AI Provider Configured?}
    ProviderCheck -->|Gemini / OpenAI| External[Query Cloud API]
    ProviderCheck -->|Mock / Error| Fallback[Generate Mock AI Sandbox Data]
    External --> Parse[Parse JSON response format]
    Fallback --> Parse
    Parse --> DB[Save to lead_ai_insights]
    DB --> Client[Display AI Insights Card on Frontend]
```
