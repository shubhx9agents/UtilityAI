# UtilityAI — Comprehensive Project Report

**Document Type:** Technical System Report  
**Date:** 13 May 2026  
**Status:** Final  
**Scope:** Full-stack coverage of the UtilityAI platform — User application (`UtilityAI`) and Administrator application (`UtilityAI-admin`)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Database & Data Model](#4-database--data-model)
5. [User Faction — UtilityAI](#5-user-faction--utilityai)
   - 5.1 [Authentication & Registration](#51-authentication--registration)
   - 5.2 [Onboarding Wizard](#52-onboarding-wizard)
   - 5.3 [Dashboard & Navigation](#53-dashboard--navigation)
   - 5.4 [AI Agents Catalogue](#54-ai-agents-catalogue)
   - 5.5 [Agent Session Management](#55-agent-session-management)
   - 5.6 [Canvas — Multi-Agent Workflow Orchestrator](#56-canvas--multi-agent-workflow-orchestrator)
   - 5.7 [Usage & Credits](#57-usage--credits)
   - 5.8 [Settings — Profile & Security](#58-settings--profile--security)
   - 5.9 [Subscription & Upgrade](#59-subscription--upgrade)
   - 5.10 [Library & Notes](#510-library--notes)
6. [Admin Faction — UtilityAI-admin](#6-admin-faction--utilityai-admin)
   - 6.1 [Admin Authentication & Access Control](#61-admin-authentication--access-control)
   - 6.2 [Admin Dashboard — Analytics Control Center](#62-admin-dashboard--analytics-control-center)
   - 6.3 [User Management](#63-user-management)
   - 6.4 [Credit Usage Monitor](#64-credit-usage-monitor)
   - 6.5 [Audit Logs](#65-audit-logs)
7. [API Layer](#7-api-layer)
   - 7.1 [User API Routes](#71-user-api-routes)
   - 7.2 [Admin API Routes](#72-admin-api-routes)
8. [Security & Middleware](#8-security--middleware)
9. [Credit & Subscription System](#9-credit--subscription-system)
10. [Context Providers & State Management](#10-context-providers--state-management)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Summary of Key Capabilities](#12-summary-of-key-capabilities)

---

## 1. Executive Summary

**UtilityAI** is a full-stack, multi-user SaaS platform built to provide businesses with an intelligent suite of AI-powered agents and a multi-agent workflow orchestration system (Canvas). The platform is divided into two independent Next.js applications:

| Application | Purpose | Framework |
|---|---|---|
| `UtilityAI` | User-facing product application | Next.js 15 (App Router) |
| `UtilityAI-admin` | Administrator control panel | Next.js 15 (App Router) |

Both applications share the same **Supabase** backend (PostgreSQL database, Row-Level Security, Auth, and Storage). The platform supports two subscription tiers — **Free** and **Premium** — with granular credit enforcement, an administrative user lifecycle management system, and a complete immutable audit trail.

---

## 2. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│   ┌─────────────────────────┐   ┌────────────────────────┐  │
│   │   UtilityAI (User App)  │   │ UtilityAI-admin (Admin)│  │
│   │  Next.js 15 App Router  │   │   Next.js 15 App Router│  │
│   └────────────┬────────────┘   └────────────┬───────────┘  │
└────────────────┼────────────────────────────┼───────────────┘
                 │                            │
┌────────────────▼────────────────────────────▼───────────────┐
│              API Layer (Next.js Route Handlers)              │
│  /api/auth  /api/agents  /api/canvas  /api/credits  /api/user│
│  /api/admin/stats  /api/admin/users  /api/admin/audit-logs  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Auth System │  │ PostgreSQL (RLS) │  │  Storage      │  │
│  │  (JWT/OAuth) │  │ profiles, agents │  │  (Images/Files│  │
│  └──────────────┘  └─────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│               External AI / Service APIs                     │
│   Google Gemini  |  Perplexity  |  Groq  |  BytePlus        │
└─────────────────────────────────────────────────────────────┘
```

**Routing Strategy:** Next.js App Router with route groups:
- `(auth)` — unauthenticated pages (login, register, forgot/reset password)
- `(dashboard)` — authenticated pages (protected by middleware session validation)

**Middleware:** The `middleware.ts` file runs on every non-static request and performs:
1. CSRF protection (origin validation for state-changing HTTP methods)
2. CORS header configuration
3. Supabase session refresh (cookie management via `updateSession`)

---

## 3. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server Components + Client Components |
| Language | TypeScript | Strict-typed throughout |
| Styling | Tailwind CSS + custom CSS | Glassmorphism, dark theme, amber accent palette |
| UI Components | shadcn/ui + Radix UI primitives | Accessible, unstyled base components |
| Animation | Framer Motion | Page transitions, card animations |
| Canvas Visualization | ReactFlow | Drag-and-drop workflow editor |
| Charts | Recharts | Area, Bar, Pie charts |
| State Management | React Context API | `AuthContext`, `SubscriptionContext`, `CreditsContext` |
| Database | Supabase (PostgreSQL) | Row-Level Security enforced |
| Authentication | Supabase Auth | Email/Password + Google OAuth |
| File Handling | Supabase Storage | Image uploads (agent inputs) |
| PDF Export | jsPDF + html2canvas + html2pdf.js | Admin dashboard and agent reports |
| JSON/CSV Export | Native Blob API | User data and agent output downloads |
| Markdown Rendering | react-markdown + remark-gfm | Agent output display |
| Validation | Zod | API route input validation |
| Notifications | Sonner (toast library) | Success, error, and info toasts |
| Package Manager | npm | Separate `node_modules` per app |
| Deployment Target | Vercel | `vercel.json` configured |

---

## 4. Database & Data Model

All data is stored in Supabase (PostgreSQL). The following tables are referenced throughout the codebase:

### Core Tables

| Table | Purpose |
|---|---|
| `profiles` | Extended user profile: role, account_type, status, api_keys |
| `onboarding_progress` | Stores the 5-step onboarding wizard state per user |
| `agent_sessions` | Stores each AI agent run — form data, AI response, chat history |
| `user_usage` | Tracks `total_credits_used` and `canvas_creations_used` per user |
| `workflows` | Canvas multi-agent workflow definitions (workflow_plan JSON) |
| `workflow_executions` | Records each workflow execution run with status and results |
| `step_executions` | Per-step execution records with input/output/status |
| `agent_history_summaries` | Summarized versions of agent sessions for orchestrator context |
| `audit_logs` | Immutable event trail: logins, role changes, session events |
| `canvas_data` | Persisted ReactFlow node/edge state |
| `notes` | User notes (title + content JSON) |
| `library` | Uploaded files and their metadata |

### Key Database Functions (Supabase RPCs)

| RPC Function | Purpose |
|---|---|
| `pre_check_agent_credit` | Read-only check for credit availability before AI call |
| `deduct_agent_credit_v2` | Atomic credit deduction after successful AI response |
| `deduct_canvas_credit` | Atomic canvas workflow creation credit deduction |

### Profile Status Lifecycle

```
active  →  suspended  →  active (restored)
active  →  deleted
suspended  →  deleted
```

### Role Hierarchy (Access Control)

```
admin  >  mod  >  user
```

- **admin:** Full access to both user app and admin panel, can change roles and status
- **mod:** View-only access to audit logs and sessions (support purposes)
- **user:** Standard access to all AI agent and canvas features

---

## 5. User Faction — UtilityAI

### 5.1 Authentication & Registration

**Location:** `app/(auth)/`

The authentication system supports two flows:

#### Email / Password Authentication
- **Registration** (`/register`): Full name, email, password with Zod-validated form. Creates a Supabase Auth user and a corresponding entry in the `profiles` table.
- **Login** (`/login`): Credential-based sign-in via `/api/auth/login`, sets HttpOnly session cookies.
- **Forgot Password** (`/forgot-password`): Sends a Supabase reset email.
- **Reset Password** (`/reset-password`): Token-based password update on return from email link.

#### Google OAuth
- Single-click Google sign-in via `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- Redirects to `/auth/callback` which completes the OAuth exchange and sets session cookies.

#### Security Notes
- Passwords are **not manageable** for Google-authenticated users (UI conditionally hides the password section in Settings).
- Session is maintained via Supabase Auth JWTs stored in HttpOnly cookies, refreshed by middleware on every request.

---

### 5.2 Onboarding Wizard

**Location:** `app/(dashboard)/onboarding/page.tsx`

A 5-step guided wizard that builds a **Business Profile** used as persistent context for AI agent prompts.

| Step | Title | Collected Information |
|---|---|---|
| 1 | Business Snapshot | Business name, industry (dropdown), website, short description |
| 2 | Key Values | Mission statement, Unique Selling Proposition (USP), brand voice/tone |
| 3 | Target Audience | Ideal customer profile, main pain points, secondary challenges |
| 4 | Goals | Primary business objective (Sales, Leads, Awareness, Retention, Efficiency) |
| 5 | Review | Collapsible/expandable summary of all entered data |

**Key Behaviours:**
- Progress is auto-saved to the `onboarding_progress` table on each "Next Step" click (upsert logic).
- A **Reset Profile** button on Step 5 wipes the database record and resets to Step 1 after confirmation.
- The saved profile data is **automatically injected** as context into all Canvas workflow executions via `buildOnboardingContextText()` in the Canvas page.
- Users can return and modify their profile at any time.

---

### 5.3 Dashboard & Navigation

**Location:** `app/(dashboard)/layout.tsx`

The dashboard shell provides a **collapsible sidebar** with the following navigation items:

| Nav Item | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | Overview/home page |
| Onboarding | `/onboarding` | Business profile wizard |
| AI Agents | `/agents` | Agent catalogue |
| Canvas | `/canvas` | Multi-agent workflow builder |
| Usage & Credits | `/usage` | Credit consumption analytics |
| Settings | `/settings` | Account profile and security |

**Sidebar Features:**
- **Collapsible:** Can be toggled to icon-only mode, state persisted to `localStorage`.
- **Upgrade CTA:** Shown only to Free plan users — "Upgrade Plan" button with Crown icon.
- **User Card:** Displays user avatar initial, plan type (Free/Premium), credit progress bar, and canvas usage. Shows "Exhausted" warning when credits are depleted.
- **Suspended/Deleted Account Gate:** If `profileStatus` from `AuthContext` is `suspended` or `deleted`, all non-settings pages render a block message preventing AI/Canvas usage. Only the `/settings` page remains accessible.

---

### 5.4 AI Agents Catalogue

**Location:** `app/(dashboard)/agents/page.tsx`

A visually rich **Bento Grid** interface displaying all 8 specialised AI agents with `ParticleCard` components, animated glow halos, hover effects, and launch CTAs.

| Agent ID | Agent Name | Category | Output Format |
|---|---|---|---|
| `deep_research` | Deep Research | Market Analysis | Structured JSON report + PDF |
| `image_generation` | Ad Image Generation | Visuals | Generated image (URL/base64) |
| `linkedin_headshot` | LinkedIn Headshot | Profile | Headshot image |
| `ad_copy` | Ad Copy Generator | Copywriting | CSV with ad variations |
| `course_generator` | Course/Coaching Generator | Education | Structured program JSON |
| `book_writing` | Book Writing Agent | Writing | Full book Markdown |
| `webinar_script` | Webinar Script Generator | Presenting | Script Markdown |
| `reel_script` | Instagram Reel Script Writer | Content | Reel script JSON |

Each agent card links to `/agents/[agentId]` which renders the agent-specific interface.

**Agent-Level Features (per `/agents/[agentId]` page):**
- Dynamic input form based on agent configuration.
- **Prompt Optimiser** — AI-powered refinement of user prompts before submission.
- **Chat Mode** — Conversational follow-up within a session.
- **Session History** — Retrievable list of all past sessions for the agent (sidebar panel).
- **Session Naming** — Auto-named on creation, manually renameable.
- **Output Rendering** — Specialised renderers per output type:
  - Markdown → `react-markdown` with GFM extension
  - CSV → Interactive data table
  - JSON Research → `DeepResearchRenderer` component with tabs
  - Images → Inline preview with download button
- **Credit Deduction** — 1 credit is deducted on each successful AI response via `deductAgentCreditOnSuccess` (atomic RPC).

---

### 5.5 Agent Session Management

**Location:** `app/api/agents/sessions/`, `components/agent-session-history.tsx`

Sessions are persisted to the `agent_sessions` table and include:
- `form_data` — the input fields submitted to the agent
- `response` — the full AI output
- `refined_prompt` — the optimised version of the prompt
- `chat_messages` — array of follow-up conversation turns
- `session_name` — display name (auto + manually editable)

**API Endpoints:**
- `GET /api/agents/sessions` — list all sessions for the current user/agent type
- `POST /api/agents/sessions` — create a new session
- `PATCH /api/agents/sessions/[id]` — update session (chat history, response, name)
- `DELETE /api/agents/sessions/[id]` — soft-delete session

---

### 5.6 Canvas — Multi-Agent Workflow Orchestrator

**Location:** `app/(dashboard)/canvas/page.tsx`

The Canvas is the most sophisticated feature of the platform — a **visual drag-and-drop workflow builder** powered by ReactFlow that allows users to compose sequences of AI agents into automated pipelines.

#### Workflow Management
- **Create Workflow** — Named canvas with optional description; stored in the `workflows` table.
- **Rename Workflow** — Inline rename with dialog confirmation.
- **Search Workflows** — Client-side filter across names and descriptions.
- **Delete Workflow** — Removes workflow and all associated executions.

#### Visual Canvas Editor (ReactFlow)
- **Node Types:**
  - `AgentNode` — Represents a single AI agent step (status badge: pending/running/completed/failed/skipped)
  - `InputNode` — Dashed border entry point for user-supplied data
  - `OutputNode` — Green border output terminal
- **Edges** — Directional arrows connecting nodes, rendered with amber handles.
- **MiniMap** — Overview of the full canvas layout.
- **Controls** — Zoom in/out and fit-to-screen.
- **Fullscreen Mode** — Toggle fullscreen canvas view.
- **Dirty State Tracking** — Unsaved changes trigger a save prompt.

#### Orchestrator (AI-Planned Workflows)
The Orchestrator dialog allows users to:
1. Describe their goal in natural language.
2. Select which agents to include.
3. Choose workflow mode: **Sequential** or **Parallel**.
4. Submit to `/api/canvas/orchestrate` — an LLM call to Gemini/Groq that returns a `WorkflowPlan` JSON defining steps, dependencies, and input mappings.
5. The plan is visualised as a ReactFlow graph automatically.

#### Execution Engine
When a workflow is run:
1. **Configuration Step** — Dynamic input form generated from `user_input_specs` of all steps. The user's onboarding profile is pre-filled as defaults.
2. **Execution Modes:**
   - `hybrid` — AI determines step ordering based on dependencies.
   - `manual` — Strictly sequential user-defined order.
3. **Progress Tracking:**
   - Step-by-step status updates with live elapsed timer and estimated time remaining.
   - Each step node on the ReactFlow canvas updates in real-time (colour-coded status rings).
   - Results overlay panel can be minimised while execution continues.
4. **Cancellation** — Abort controller sends a stop signal mid-execution.
5. **Result Viewer:**
   - Side panel with tabs for each step's output.
   - Summary view (merged LLM summary of all step outputs).
   - User inputs view.
   - Per-step JSON inspector.
   - Download buttons: `.md`, `.csv`, `.jpg`, `.pdf` as appropriate per output type.

#### Workflow History
- `showHistoryDialog` — Full execution history per workflow with replay capability.

#### Prompt Optimiser
- `/api/canvas/optimize-prompt` — AI-powered prompt refinement tool accessible per node.

#### Credit Enforcement (Canvas)
- Each new workflow creation deducts 1 canvas credit via `enforceAndDeductCanvasCredit`.
- The `ExhaustedBanner` component is rendered at the top of the Canvas if either agent or canvas credits are exhausted.

---

### 5.7 Usage & Credits

**Location:** `app/(dashboard)/usage/page.tsx`

A dedicated analytics dashboard for users to monitor their credit consumption.

**Dashboard Cards (4 KPIs):**
| Card | Data Source |
|---|---|
| Total Credits Used | `user_usage.total_credits_used` |
| Remaining Credits | Derived from plan limits |
| Total Executions | `workflow_executions` count |
| Total Workflows | `workflows` count |

**Charts:**
- **Credit Usage Trend** (Area chart) — Credits consumed per day over the last 30 days.
- **Usage Breakdown** (Horizontal Bar chart) — Credits by agent type.

**Detailed Activity Table:**
- Lists all credit-consuming events with action type, agent name, date, and credits consumed.
- Actions include: `agent_run`, `canvas_create`.

**Plan Limits (constants in `lib/credits.ts`):**

| Plan | Agent Outputs | Canvas Workflows |
|---|---|---|
| Free | 10 | 3 |
| Premium | 50 | 20 |

---

### 5.8 Settings — Profile & Security

**Location:** `app/(dashboard)/settings/page.tsx`

A two-column settings page containing:

#### Profile Card
- Displays: read-only email field, editable display name.
- Save Changes button (persists name update).

#### Security Card
Conditional rendering based on authentication provider:

- **Google Users:** Informational block explaining password management is unavailable. A "Manage Google Security" outbound link redirects to `myaccount.google.com/security`.
- **Email/Password Users:** Full password change form:
  - Current password
  - New password (min 8 characters)
  - Confirm new password
  - Validation errors and success messages inline.
  - "Forgot Password?" link to `/forgot-password`.
  - Password update via `POST /api/auth/password/update`.

---

### 5.9 Subscription & Upgrade

**Location:** `app/(dashboard)/upgrade/`, `contexts/SubscriptionContext.tsx`

The subscription system is surfaced across multiple touchpoints:
- **Sidebar** — "Upgrade Plan" CTA for Free users.
- **Usage page** — "Upgrade to Premium" button.
- **Canvas** — Credit exhaustion banner with upgrade prompt.
- `isPremium` flag from `SubscriptionContext` controls premium-gated features.
- Upgrade is triggered via `POST /api/auth/upgrade`.

---

### 5.10 Library & Notes

**Location:** `app/(dashboard)/library/`, `app/(dashboard)/notes/`

- **Library:** A file/asset repository. Users can upload images and other media which are stored in Supabase Storage. Metadata (file_type, file_name, file_data) is stored in the `library` table.
- **Notes:** A lightweight note-taking feature. Notes are stored as JSON content in the `notes` table with title and content fields.

---

## 6. Admin Faction — UtilityAI-admin

The admin application is a completely separate Next.js project. It connects to the same Supabase backend but uses the **service role key** for privileged operations that bypass Row-Level Security.

### 6.1 Admin Authentication & Access Control

**Location:** `app/login/`, `app/api/auth/`

- Dedicated admin login page at `/login`.
- Authentication via Supabase Auth (same credentials as the user app).
- Every admin API route validates the caller's role via `lib/admin.ts`:
  - Fetches the user's `profiles.role` from Supabase.
  - Returns `403 Forbidden` if role is not `admin` or `mod`.
- The admin layout redirects non-admin users back to their dashboard if the role check fails.

### 6.2 Admin Dashboard — Analytics Control Center

**Location:** `app/admin/page.tsx`

The primary admin analytics view, dubbed the **"Admin Control Center"**.

#### Global Date Filter
All analytics data is filterable by a time period selector at the top of the dashboard:

| Period | Description |
|---|---|
| Today | Current day |
| Past Week | Last 7 days |
| This Month | Calendar month |
| This Year | Calendar year |
| Custom Range | User-defined start and end date |

Filter state triggers a fresh API call to `/api/admin/stats` on every change.

#### KPI Cards (8 Total — Page 1 of PDF)

**Row 1:**
| Card | Metric |
|---|---|
| Total Users | All registered users (all-time, unfiltered) |
| Filtered Sessions | Agent sessions created in the selected period |
| Activity Events | Audit log actions in the selected period |
| Top Agent | Most-used agent type with session count |

**Row 2:**
| Card | Metric |
|---|---|
| Period Logins | `user.login` events in the period |
| Period Logouts | `user.logout` events in the period |
| Agent Types | Count of unique active agent types |
| Total Actions | Sum of all audited events |

#### Charts

| Chart | Type | Description |
|---|---|---|
| Agents Distribution | Donut/Pie chart | Session share by agent type in the period |
| Activity Timeline | Area chart | Actions and sessions created over time |
| Top Action Types | Bar chart | Most executed action categories |
| Resource Mix | Progress bars | Resources (session, role, etc.) by interaction volume |

#### Most Active Users
A table of the top users by action volume in the selected period (email + action count).

#### Quick Navigation Links
Two card links at the bottom of the dashboard:
- **Audit Logs** → `/admin/audit-logs`
- **User Management** → `/admin/users`

#### PDF Export
- **"Export PDF"** button in the header triggers `downloadPdf()`.
- Uses `jsPDF` + `html2canvas` to capture each `[data-pdf-section]` element as a separate landscape A4 page.
- Each page includes a styled header bar: "UtilityAI · Admin Dashboard Report", period label, current date/time, and page number.
- Saves as `admin-report-YYYY-MM-DD.pdf`.

---

### 6.3 User Management

**Location:** `app/admin/users/page.tsx`

A comprehensive user lifecycle management interface.

#### Summary Cards (4 KPIs)
| Card | Value |
|---|---|
| Total Users | Count of all users |
| Admins | Count of admin-role users |
| Regular Users | Count of standard users |
| Premium Users | Count of premium-subscribed users |

#### Filter & Search
- **Search by Email** — real-time substring filter.
- **Time Period (Joined Date):** All Time / Last 30 Days / Last 90 Days / Last 365 Days / Custom Range.

#### Users Table
Columns displayed per user:

| Column | Description |
|---|---|
| Email | User's email address |
| Role | Badge: Admin (Crown) / Mod (Shield) / User |
| Subscription | Badge: Premium (amber) / Free (grey) |
| Status | Badge: Active (green) / Suspended (orange) / Deleted (red) |
| Joined | Account creation date |
| Last Login | Last authentication timestamp |
| Sessions | Total agent session count |
| Actions | Contextual action buttons |

#### Action Buttons Per User
| Button | Condition | Effect |
|---|---|---|
| Change Role | Always visible | Opens a dialog to select new role (User / Mod / Admin) with role descriptions |
| Revoke Premium | Only for Premium users | Downgrades to Free plan with confirmation |
| Suspend | Only when Active | Sets `profiles.status = 'suspended'`, blocks AI/Canvas access |
| Restore | Only when Suspended or Deleted | Sets `profiles.status = 'active'`, restores access |
| Delete | Only when Active or Suspended | Sets `profiles.status = 'deleted'`, permanently blocks access |

#### Export CSV
Downloads filtered user list as a `.csv` file with columns: ID, Email, Role, Subscription, Status, Joined Date, Last Login, Sessions.

---

### 6.4 Credit Usage Monitor

**Location:** `app/admin/credits/page.tsx`

A real-time credit consumption overview across all users.

#### Summary Strip (4 KPIs)
| KPI | Description |
|---|---|
| Total Users | All users in the system |
| Premium | Users on premium plan |
| Exhausted | Users whose agent or canvas credits are depleted |
| Avg Credits Used | Average `total_credits_used` across all users |

#### Filters
- **Search by email** — substring filter.
- **Quick tabs:** All / Free / Premium / ⚠ Exhausted

#### Credit Usage Table
| Column | Description |
|---|---|
| User | Email + truncated UUID |
| Plan | Free or Premium badge |
| Agent Credits | Progress bar (used/limit), red if exhausted |
| Canvas Creations | Progress bar (used/limit), red if exhausted |
| Last Activity | Date of last credit event |
| Status | Active (green) / Exhausted (red) badge |

**Data Source:** `GET /api/admin/credit-usage`  
**Refresh Button:** Manually re-fetches data with a spinner indicator.

---

### 6.5 Audit Logs

**Location:** `app/admin/audit-logs/page.tsx`

A comprehensive, paginated audit trail viewer for all platform events.

#### Tracked Audit Actions

| Category | Actions |
|---|---|
| User | `user.login`, `user.logout`, `user.signup`, `user.password_reset`, `user.deleted`, `user.data_exported`, `user.login_failed` |
| Session | `session.created`, `session.updated`, `session.deleted`, `session.restored` |
| Role | `role.updated` |
| Security | `security.ip_blocked`, `security.rate_limited` |

#### Summary Metrics (4 KPIs)
| Card | Value |
|---|---|
| Visible Events | Count of logs on current page matching filters |
| Logins | `user.login` count in filtered view |
| Logouts | `user.logout` count in filtered view |
| Sessions Created | `session.created` count in filtered view |

#### Filtering
- **Action Type** dropdown — filter by specific audit action.
- **Search by Email** — substring filter on `user_email` field.

#### Log Table Columns
| Column | Description |
|---|---|
| Action | Colour-coded monospace badge (blue=user, green=session, amber=role) |
| Description | Human-readable event summary |
| User | Email or "System" |
| Resource | Resource type + resource ID (truncated UUID) |
| Details | JSON metadata preview (100 character truncation) |
| IP | Client IP address |
| Time | Full timestamp |

#### Pagination
- 50 logs per page.
- Previous / Next navigation with page counter.

#### Clear All Logs
- A **"Clear All Logs"** button triggers a `DELETE /api/admin/audit-logs/clear` call.
- Requires confirmation dialog. Irreversible.

---

## 7. API Layer

### 7.1 User API Routes

**Base path:** `UtilityAI/app/api/`

| Route | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Email/password login, sets session cookies |
| `/api/auth/register` | POST | New user registration |
| `/api/auth/logout` | POST | Clears session cookies, logs audit event |
| `/api/auth/password/update` | POST | Validates current password, updates to new |
| `/api/auth/password/reset` | POST | Sends reset email via Supabase |
| `/api/auth/subscription` | GET | Returns current user's subscription plan |
| `/api/auth/upgrade` | POST | Upgrades user to premium (sets `account_type = premium`) |
| `/api/agents/run` | POST | Executes an agent (credit pre-check → AI call → credit deduction) |
| `/api/agents/chat` | POST | Sends a follow-up chat message within a session |
| `/api/agents/sessions` | GET / POST | List / Create agent sessions |
| `/api/agents/sessions/[id]` | PATCH / DELETE | Update / Delete a specific session |
| `/api/agents/book-chapter` | POST | Generate a single book chapter |
| `/api/agents/book-research` | POST | Deep research phase for book writing |
| `/api/agents/scrape` | POST | Web scraping utility for Deep Research agent |
| `/api/canvas/workflows` | GET / POST | List / Create workflows |
| `/api/canvas/workflows/[id]` | GET / PATCH / DELETE | Manage a specific workflow |
| `/api/canvas/orchestrate` | POST | AI orchestration — generates a WorkflowPlan from instruction |
| `/api/canvas/optimize-prompt` | POST | AI prompt optimisation |
| `/api/canvas/executions` | POST | Start a workflow execution |
| `/api/canvas/histories` | GET | Retrieve agent history summaries for orchestrator |
| `/api/credits/stats` | GET | User's credit usage stats, trends, and history |
| `/api/user/profile` | GET / PATCH | Get or update user profile |
| `/api/download` | GET | Proxy endpoint for downloading external image URLs |
| `/api/admin` | Internal | Admin check endpoint (role validation) |

### 7.2 Admin API Routes

**Base path:** `UtilityAI-admin/app/api/`

| Route | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Admin login |
| `/api/auth/logout` | POST | Admin logout |
| `/api/auth/check` | GET | Session validity check |
| `/api/admin/stats` | GET | Dashboard analytics (date-filtered) |
| `/api/admin/users` | GET | All users with role, status, session count |
| `/api/admin/users/[userId]/role` | POST | Change a user's role |
| `/api/admin/users/[userId]/status` | POST | Suspend, Delete, or Restore a user |
| `/api/admin/users/[userId]/subscription` | POST | Revoke premium subscription |
| `/api/admin/audit-logs` | GET | Paginated audit log retrieval (with filters) |
| `/api/admin/audit-logs/clear` | DELETE | Permanently delete all audit log records |
| `/api/admin/credit-usage` | GET | Per-user credit usage with exhaustion flags |
| `/api/admin/requests` | GET | Access request management |
| `/api/admin/check` | GET | Admin role verification middleware helper |

---

## 8. Security & Middleware

### Middleware (`middleware.ts`)

Runs on every non-static request and enforces:

1. **CORS Preflight Handling** — Responds to `OPTIONS` requests for all `/api/*` routes.
2. **State-Changing Method Origin Validation (CSRF Protection):**
   - Applies to `POST`, `PATCH`, `DELETE`, `PUT` requests to `/api/*`.
   - Validates request origin via `validateOrigin(request)` from `lib/security.ts`.
   - Returns `403 Forbidden` if origin does not match `NEXT_PUBLIC_SITE_URL`.
3. **Session Refresh** — Calls `updateSession(request)` from `lib/supabase/middleware` to refresh Supabase Auth tokens via cookie.
4. **CORS Headers** — Applied to all API responses.

### Security Utilities (`lib/security.ts`)

- IP extraction from `x-forwarded-for` and `x-real-ip` headers.
- Rate limiting logic.
- Origin validation for CSRF protection.
- Suspicious activity pattern detection.

### Admin Access Enforcement (`lib/admin.ts`)

Before any admin action is taken:
1. Session is extracted from cookies.
2. The user's `role` is queried from the `profiles` table.
3. Only `admin` and `mod` roles are permitted; all others receive `403`.

### Supabase Row-Level Security (RLS)

- User data is partitioned by `user_id` — users can only read/write their own records.
- The admin app uses the **service role key** which bypasses RLS for cross-user administrative operations.

### Audit Trail

Every significant platform event is recorded in `audit_logs` with:
- User identity (user_id + user_email)
- Action type (standardised string)
- Resource affected (resource_type + resource_id)
- JSON event details
- Client IP address and user agent
- Timestamp

---

## 9. Credit & Subscription System

### Plan Limits

```
Free Plan:
  - Agent Outputs: 10 total successful AI responses
  - Canvas Workflows: 3 total creations

Premium Plan:
  - Agent Outputs: 50
  - Canvas Workflows: 20
```

### Credit Lifecycle

```
User initiates AI agent run
      │
      ▼
preCheckAgentCredit()  ← Read-only check (no deduction)
      │
      ├─ allowed=false → Return 402 Payment Required ("CREDITS_EXHAUSTED")
      │
      ▼
AI API call executes (Gemini / Perplexity / Groq / BytePlus)
      │
      ▼
deductAgentCreditOnSuccess()  ← Atomic deduction via RPC (row lock)
      │
      ├─ allowed=false → Concurrent request filled the last slot (rare)
      │
      ▼
Response returned to user + credit deducted
```

### Canvas Credit Lifecycle

```
User creates a new Canvas workflow
      │
      ▼
enforceAndDeductCanvasCredit()  ← Atomic check + deduct
      │
      ├─ allowed=false → Return 402 (canvas limit reached)
      │
      ▼
Workflow created in DB
```

### UI Enforcement Points
- **`ExhaustedBanner`** component — rendered at top of Canvas and agent pages when credits are depleted.
- **Agent page** — "Launch Agent" attempt with 0 credits shows error toast.
- **Sidebar** — Credit progress bar with "Exhausted" label when limit is reached.
- **Usage page** — Progress cards show percentage used with red highlight above 80%.

---

## 10. Context Providers & State Management

The user application uses React Context API for shared state:

| Context | Hook | Data / Methods |
|---|---|---|
| `AuthContext` | `useAuth()` | `user`, `loading`, `signIn`, `signUp`, `signInWithGoogle`, `signOut`, `profileStatus` |
| `SubscriptionContext` | `useSubscription()` | `isPremium`, `upgrade()`, subscription details |
| `CreditsContext` | `useCredits()` | `usage` (total_credits_used, canvas_creations_used), `limits` (outputs, canvas, per_agent), `isAgentExhausted`, `isCanvasExhausted`, `refetchUsage()` |

`AuthContext` automatically:
- Fetches the current session on mount.
- Subscribes to `supabase.auth.onAuthStateChange` for real-time session updates.
- Fetches `profiles.status` on login/session refresh to detect suspended/deleted accounts.

---

## 11. Infrastructure & Deployment

### Deployment Platform
Both applications are configured for **Vercel** deployment:
- `vercel.json` in the user app defines function timeouts and rewrites.
- Each app has its own `env.local` with distinct environment variables.

### Environment Variables (User App)
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key for server-side admin operations |
| `NEXT_PUBLIC_SITE_URL` | Canonical app URL (CSRF validation) |
| `GOOGLE_AI_API_KEY` | Gemini API key |
| `PERPLEXITY_API_KEY` | Perplexity API for Deep Research |
| `GROQ_API_KEY` | Groq API for orchestration LLM |
| `BYTEPLUS_API_KEY` | BytePlus API for Seedream image model |

### Environment Variables (Admin App)
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged operations (bypasses RLS) |

### File Structure Summary

```
MAIN/
├── UtilityAI/              ← User application
│   ├── app/
│   │   ├── (auth)/         ← Login, Register, Forgot/Reset Password
│   │   ├── (dashboard)/    ← All authenticated user pages
│   │   │   ├── agents/     ← Agent catalogue + [agentId] pages
│   │   │   ├── canvas/     ← ReactFlow workflow orchestrator
│   │   │   ├── dashboard/  ← Home overview
│   │   │   ├── onboarding/ ← 5-step business profile wizard
│   │   │   ├── settings/   ← Profile and security
│   │   │   ├── usage/      ← Credit analytics
│   │   │   ├── upgrade/    ← Subscription upgrade
│   │   │   ├── library/    ← File uploads
│   │   │   └── notes/      ← Note-taking
│   │   └── api/            ← All user-facing API routes
│   ├── components/         ← UI components (agents, canvas, landing)
│   ├── contexts/           ← AuthContext, SubscriptionContext, CreditsContext
│   ├── lib/                ← credits.ts, security.ts, audit.ts, supabase/
│   ├── types/              ← index.ts (all TypeScript interfaces)
│   └── middleware.ts       ← CSRF + CORS + session refresh
│
└── UtilityAI-admin/        ← Administrator application
    ├── app/
    │   ├── admin/          ← Admin pages
    │   │   ├── page.tsx    ← Main analytics dashboard
    │   │   ├── users/      ← User management
    │   │   ├── credits/    ← Credit usage monitor
    │   │   └── audit-logs/ ← Audit trail viewer
    │   └── api/admin/      ← All admin-privileged API routes
    ├── components/         ← Shared UI components
    ├── lib/                ← admin.ts, security.ts, audit.ts, supabase/
    └── types/              ← Admin-specific TypeScript types
```

---

## 12. Summary of Key Capabilities

### User-Facing Capabilities

| Capability | Description |
|---|---|
| Dual Auth | Email/Password + Google OAuth with conditional UI |
| Business Onboarding | 5-step wizard with persistent business profile |
| 8 AI Agents | Deep Research, Ad Image, LinkedIn Headshot, Ad Copy, Course Generator, Book Writing, Webinar Script, Reel Script |
| Session Persistence | All agent runs stored with full input, output, and chat history |
| Prompt Optimisation | AI-assisted prompt refinement before submission |
| Canvas Orchestrator | Visual drag-and-drop multi-agent pipeline builder (ReactFlow) |
| AI Workflow Planning | Natural language instruction → auto-generated workflow plan |
| Real-Time Execution | Step-by-step execution with live status, timer, and cancellation |
| Multi-Format Downloads | .md, .csv, .jpg, .pdf output downloads per agent type |
| Credit System | Plan-based (Free/Premium) credit tracking with exhaustion gates |
| Usage Analytics | Credit trend chart, usage breakdown, and detailed activity table |
| Account Management | Profile update, conditional password change, subscription upgrade |
| Status Enforcement | Suspended/Deleted users blocked from AI/Canvas via `profileStatus` check |

### Administrator Capabilities

| Capability | Description |
|---|---|
| Secure Admin Login | Separate admin app with role-gated access |
| Analytics Dashboard | 8 KPI cards, 4 charts, time-filtered, PDF exportable |
| User Management | View all users; change role, subscription, and account status |
| Account Lifecycle | Suspend / Restore / Delete users with confirmation dialogs |
| Subscription Control | Revoke premium access per user |
| User Export | Filtered user list export to CSV |
| Credit Monitoring | Per-user credit usage dashboard with exhaustion alerts |
| Audit Trail | Paginated, filterable full event history for all user actions |
| Log Management | Clear all audit logs (destructive, with confirmation) |

---

*End of Report*
