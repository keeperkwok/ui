# UI — Claude Code Guide

## Project Overview

Frontend for the Beryl platform (药物研发 Agent 工作台).
Built with Vite + React 18 + TypeScript + Ant Design 5.

## Tech Stack

- **Framework**: React 18 + TypeScript (strict mode)
- **Build tool**: Vite 6
- **UI library**: Ant Design 5
- **Routing**: React Router v6
- **HTTP client**: Axios (with interceptors for token refresh)
- **Package manager**: pnpm

## Project Layout

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root component with router
├── router/
│   └── index.tsx         # Routes + AuthGuard
├── pages/
│   ├── Login.tsx         # Login + Register (Tab switcher)
│   └── Home.tsx          # Main dashboard page
├── components/
│   └── layout/
│       └── Sidebar.tsx   # Left navigation sidebar
├── services/
│   ├── http.ts           # Axios instance with interceptors
│   └── auth.ts           # Auth API calls (login/register/logout/refresh)
└── utils/
    └── token.ts          # localStorage token helpers
```

## Key Conventions

- All API calls go through `src/services/http.ts` — never use raw `axios` or `fetch`
- Tokens stored in `localStorage` under keys `access_token` / `refresh_token`
- 401 responses trigger automatic token refresh; if refresh fails, redirect to `/login`
- Dev proxy: `/api` → `http://localhost:8002` (configured in `vite.config.ts`)
- Use `@/` alias for `src/` imports
- No `any` types — use proper interfaces defined alongside the API call

## Common Commands

```bash
pnpm install       # Install dependencies
pnpm dev           # Dev server at http://localhost:3000
pnpm build         # Production build
pnpm preview       # Preview production build
```

## Auth Service API Base

- Dev: proxied via `/api` (Vite dev server → `http://localhost:8002`)
- Production: set `VITE_API_BASE_URL` in `.env.production`
