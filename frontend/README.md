# NexLedger Frontend

Intelligent financial ledger and analytics platform built with Angular 21.

## Stack

- Angular 21 (standalone components, signals)
- Tailwind CSS 4 with custom design tokens
- Vitest for unit testing
- TypeScript strict mode

## Setup

```bash
bun install
```

## Development

```bash
# Start dev server on http://localhost:4200
ng serve

# Run tests
ng test

# Lint
ng lint

# Type check
npm run typecheck
```

## Build

```bash
# Production build (outputs to dist/NexLedger-frontend/browser)
ng build
```

## Deployment

The app is deployed on Vercel. Every push to the default branch triggers an automatic deployment.

## Architecture

```
src/
├── app/
│   ├── core/          # Models, services, guards, interceptors
│   ├── features/      # Feature modules (auth, dashboard, records, users, profile)
│   └── shared/        # Shared components, layouts
├── environments/      # Environment configs
└── styles.css         # Global styles + Tailwind theme
```

## Features

- **Auth** — Login, register, forgot password, JWT with refresh
- **Dashboard** — Analytics cards, cashflow chart, category breakdowns, activity feed
- **Records** — Full CRUD with filters, pagination, admin actions
- **Users** — Admin panel with role/status management, audit logs
- **Profile** — Personal info, security settings, sessions, avatar picker
