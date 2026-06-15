# Rival Tasks — Web

The web client for the Rival Tasks API — a team task manager with real-time collaboration.
The backend (NestJS) lives in a separate repository; this app talks to it over REST + SSE.

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4** + **shadcn/ui** (neutral theme, Phosphor icons)
- **zustand** for state (auth, teams, tasks, presence, theme)
- **react-hook-form + zod** for forms and client-side validation
- **EventSource (SSE)** for live updates and presence

## Features

- Email auth (sign up, sign in, OTP verify) with the session persisted across refresh
- Task **board** and **list** views, with status filter, title search, sort (due/priority/created/updated), and pagination
- Create / edit / delete tasks, mark complete, assign to a member
- **Real-time**: tasks update live across clients; presence shows who's online
- Teams: members, role assignment, email invites (+ public accept page), create team
- Admin: manage users (role, enable/disable), browse all teams and tasks
- Dark mode (persisted), responsive layout, and loading / empty / error states throughout

## Getting started

### Prerequisites

- **Node.js** 20+ (developed on 24)
- The **Rival Tasks API** running (default `http://localhost:4000/api/v1`)

### Run it

```bash
npm install

# point the app at your API
cp .env.example .env.local      # edit NEXT_PUBLIC_API_URL if needed

npm run dev                     # http://localhost:3000
```

> In development the backend's OTP is always `000000`, so you can complete sign-up without email.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Lint |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, including the `/api/v1` prefix |

## How it's wired

- **Auth** is cookie-based (httpOnly, set by the API). On load the app calls `GET /auth/me` to
  rehydrate the session into a zustand store; the API client sends `credentials: 'include'` and
  retries once via `/auth/refresh-token` on a 401.
- **Routes** use two groups: `(auth)` (login/signup/verify) and `(app)` (guarded shell with sidebar,
  team switcher, topbar). Pages are client components, so dynamic params come from `useParams()`.
- **Real-time** opens one SSE stream per active team and fans events into the task and presence
  stores — so a teammate's change appears without a refresh.
- **Theme** is applied before paint via a small inline script to avoid a flash, and persisted by zustand.
