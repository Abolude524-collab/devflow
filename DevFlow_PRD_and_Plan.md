# DevFlow - Product Requirements Document (PRD) & Development Plan

## 1. Project Overview
**DevFlow** is a comprehensive developer project management and collaboration platform. It combines the Kanban organization of Trello, the code integration of GitHub Projects, the real-time communication of Slack, and the context-awareness of modern AI assistants.

---

## 2. Technical Stack
- **Frontend:** React, TypeScript, Tailwind CSS, TanStack Query (Data Fetching), Zustand (State Management), Vite.
- **Backend:** Node.js, Fastify, TypeScript, REST API, WebSockets (Socket.IO).
- **Database & ORM:** PostgreSQL, Prisma ORM, Redis (for caching & WebSocket scaling).
- **Authentication:** JWT (JSON Web Tokens) & Google OAuth.
- **AI Integration:** Google Gemini API / OpenAI API.
- **DevOps:** Docker, GitHub Actions, Vercel (Frontend), Railway/Render (Backend).

---

## 3. System Architecture & Folder Structure

To prevent the backend from becoming disorganized, DevFlow will use a **Domain-Driven Directory Structure**. Fastify thrives when routes, schemas, and controllers are grouped by feature rather than file type.

### Backend Structure (Fastify + Prisma)
```text
backend/
├── prisma/
│   └── schema.prisma         # Database models
├── src/
│   ├── config/               # Environment variables & constants
│   ├── plugins/              # Fastify plugins (Redis, Prisma connection, JWT setup)
│   ├── shared/               # Shared utilities, generic types, logger
│   ├── modules/              # Domain modules
│   │   ├── auth/
│   │   │   ├── auth.routes.ts      # Fastify route definitions
│   │   │   ├── auth.controller.ts  # Request handling & HTTP responses
│   │   │   ├── auth.service.ts     # Business logic
│   │   │   └── auth.schema.ts      # Zod/TypeBox validation schemas
│   │   ├── user/
│   │   ├── workspace/
│   │   ├── project/
│   │   ├── task/
│   │   └── github/
│   ├── websockets/           # Socket.io event handlers and room logic
│   └── server.ts             # Application entry point & Fastify instantiation
├── package.json
└── tsconfig.json
```

### Frontend Structure (React + Vite)
```text
frontend/
├── src/
│   ├── assets/               # Images, icons, fonts
│   ├── components/           # Shared UI components (Buttons, Modals, Inputs)
│   ├── features/             # Feature-based modules (mirroring backend domains)
│   │   ├── kanban/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── store/        # Zustand slice for Kanban state
│   │   ├── auth/
│   │   └── workspace/
│   ├── hooks/                # Global custom hooks
│   ├── layouts/              # Page layouts (Dashboard Layout, Auth Layout)
│   ├── lib/                  # Third-party library configurations (Axios, queryClient)
│   ├── pages/                # Route components
│   ├── store/                # Global Zustand store index
│   ├── types/                # Global TypeScript definitions
│   └── App.tsx               # Root component & routing
├── package.json
└── vite.config.ts
```

---

## 4. Development Phases (The Execution Plan)

### Phase 1: Foundation (Auth, DB, Users, Workspaces)
**Goal:** Establish the core infrastructure and allow users to register, log in, and create isolated workspaces.
- Initialize PostgreSQL database and design Prisma schema for `User`, `Workspace`, and `WorkspaceMember`.
- Set up Fastify server and configure plugins (CORS, Helmet, JWT).
- Implement email/password registration and login with JWT session handling.
- Implement Google OAuth flow.
- Create CRUD API for Workspaces and Projects.
- Build the frontend authentication pages (Login, Register) and the main Workspace Dashboard layout.

### Phase 2: Project Management (The Kanban Engine)
**Goal:** Build the core task management capabilities. This is the heart of the application.
- Expand Prisma schema with `Project`, `Board`, `Column`, `Task`, `Comment`, and `Tag`.
- Build backend REST API for Kanban CRUD operations (creating tasks, moving tasks between columns, editing details).
- Implement frontend UI: The Kanban Board view using a drag-and-drop library (e.g., `dnd-kit`).
- Connect React UI to Fastify API using TanStack Query for data fetching and mutations.
- Implement optimistic UI updates (moving a card instantly on the frontend while the backend request resolves).

### Phase 3: Real-Time Collaboration (Multiplayer Mode)
**Goal:** Make the application feel alive and synchronized for multiple concurrent users.
- Integrate Socket.io with the Fastify server.
- Set up WebSocket rooms (e.g., users join a room matching the `projectId`).
- Refactor task movement logic: when a user updates a task via REST, the server emits a WebSocket event to all other clients in the room to update their UI.
- Implement online/offline status indicators.
- Add real-time Project Chat and typing indicators.

### Phase 4: GitHub Integration (Developer Workflow)
**Goal:** Pull external code context into the project management space.
- Register a GitHub OAuth App and handle the authorization flow.
- Connect a workspace/project to a specific GitHub repository.
- Use GitHub Webhooks (received by a Fastify route) to listen for Push events, Pull Request updates, and Issue creation.
- Display a "Recent Commits" and "Active PRs" widget on the Project Dashboard.
- Implement auto-linking: typing `DEVFLOW-123` in a GitHub PR auto-updates task status in DevFlow.

### Phase 5: AI Assistant (Contextual Intelligence)
**Goal:** Integrate LLM capabilities to automate mundane project management tasks.
- Integrate the Gemini API or OpenAI API via the Node SDK.
- Build a chat interface inside the project view.
- Provide the AI with context: fetch the last 50 tasks, recent commits, and chat history, and inject them into the system prompt.
- Enable commands: "Summarize project activity this week," "Generate a bug report task from this PR," or "Suggest next priorities."

### Phase 6: Production & Polish
**Goal:** Harden the application for real users and public deployment.
- Dockerize the Fastify backend and PostgreSQL database.
- Implement rate limiting (Fastify rate-limit plugin) and audit logs for admin dashboards.
- Deploy the database (e.g., Supabase, Render).
- Deploy the Node.js Fastify backend (e.g., Railway, Render).
- Deploy the React frontend (e.g., Vercel).
- Set up GitHub Actions for CI/CD to automate testing and deployment on push.

---

## 5. AI Prompt Templates for Code Generation

*When you are ready to start coding a specific phase, use this prompt structure with your AI coding assistant (e.g., GitHub Copilot, Cursor, or ChatGPT).*

### Meta-Prompt for AI Assistants:

```text
You are an expert full-stack engineer. We are building "DevFlow," a developer project management tool. 

**Stack:**
- Backend: Node.js, Fastify, TypeScript, Prisma ORM, PostgreSQL.
- Frontend: React, TypeScript, Tailwind CSS, Zustand, TanStack Query.
- Architecture: Domain-driven module structure on the backend.

**Task:**
I am currently working on [INSERT PHASE OR FEATURE, e.g., Phase 1: Authentication and User Registration].

**Requirements:**
1. Please generate the Prisma schema model(s) required for this feature.
2. Generate the Fastify route, controller, and schema (Zod/TypeBox) for this feature. 
3. Ensure the Fastify implementation uses an encapsulated plugin approach.
4. Generate the React component using Tailwind CSS and integrate TanStack Query for the API call.

Please output the code in a clean, production-ready format with comments explaining the integration points.
```
