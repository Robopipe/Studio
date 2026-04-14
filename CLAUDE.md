# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Robopipe Studio is an open-source industrial machine vision and AI quality inspection platform. Workflow: **Capture -> Label -> Train -> Infer**. It captures/processes image data, labels images, trains ML models, and deploys them to Luxonis Edge-Compute hardware.

## Monorepo Structure

pnpm Turborepo monorepo with three apps and shared packages:

- **`apps/api`** — NestJS v11 REST API (TypeScript, Express, Drizzle ORM, PostgreSQL)
- **`apps/web`** — React 19 SPA (TypeScript, Vite 7, Redux Toolkit / RTK Query, react-router v7, Tailwind v4 + shadcn-style primitives)
- **`apps/ml`** — Python FastAPI ML training service (luxonis-train, PyTorch, ONNX)
- **`packages/database`** — Drizzle ORM schema & relations (shared DB definitions)
- **`packages/schema`** — Zod validation schemas (shared between API and web)
- **`packages/eslint-config`** — Shared ESLint flat configs
- **`packages/typescript-config`** — Shared tsconfig presets
- **`packages/jest-config`** — Shared Jest configs

## Common Commands

```bash
# Root-level (Turborepo)
pnpm install              # Install all dependencies
pnpm dev                  # Run all apps in dev mode
pnpm build                # Build all packages and apps (packages first via ^build)
pnpm test                 # Run all tests
pnpm test:e2e             # Run e2e tests
pnpm lint                 # Lint all packages
pnpm format               # Prettier format all TS/TSX/MD files

# API (apps/api) — NestJS on port 3000
pnpm -F api dev           # Dev with hot-reload (nest start --watch)
pnpm -F api build         # Build
pnpm -F api test          # Jest unit tests
pnpm -F api test:e2e      # Jest e2e tests (apps/api/test/)
pnpm -F api drizzle:push  # Push schema to database
pnpm -F api drizzle:generate  # Generate migrations

# Web (apps/web) — Vite on port 5173
pnpm -F web dev           # Dev server
pnpm -F web build         # TypeScript check + Vite build
pnpm -F web lint          # ESLint

# ML (apps/ml) — FastAPI on port 8000
cd apps/ml && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m app             # Run ML service

# Docker
docker compose up --build                      # Start all services
docker compose exec api pnpm -F api drizzle:push  # Run DB migrations
```

## Architecture Details

### API (`apps/api`)
- **Module structure**: Feature modules in `src/modules/` (auth, organization, project, task, model, training-external, assets, user)
- **Repository pattern**: `src/repository/` wraps Drizzle queries for each entity
- **Config**: Multi-source — env vars, YAML files (`config.local.yml`, `secrets.local.yml`), GCP Secret Manager. See `src/core/configuration/`
- **Auth**: Passport.js with JWT + local strategies, bcrypt passwords, cookie-based refresh tokens
- **Validation**: Global `ZodValidationPipe` from nestjs-zod; schemas from `@repo/schema`
- **API versioning**: URI-based at `/v1/...`, Swagger docs at `/doc`
- **File storage**: Google Cloud Storage (GCS) for images/models

### Web (`apps/web`)
- **State**: Redux Toolkit with RTK Query. Store in `src/store/`, hooks in `src/hooks/redux.ts`
- **RTK Query APIs**: 5 API slices (studioApi, cameraApi, etc.) with automatic JWT refresh logic in `src/core/api/`
- **Routing**: react-router v7 (`createBrowserRouter`), route paths defined in `src/config/web/routes.ts`
- **Styling**: Tailwind v4 with the brand color palette (`bg-emerald-500`, `text-pear-300`, etc.) defined in `src/global.css`. Light theme only — see the dormant `.dark` block.
- **UI primitives**: shadcn-style components (Base UI variant) in `src/modules/shadcn/ui/*`. Configured via `apps/web/components.json`. The only theming entrypoint is `src/global.css`.
- **Brand-specific icons**: `src/components/icons/*` (industrial-domain icons with no `lucide-react` equivalent: AiPower, Connector, Controller, Ethernet, GSM, Indicator, Infere, Input, Model, Motor, NoCamera, Output, PowerSource, Sensor, RectBbox, Polygon, RemoveAnnotation, Annotate, CardView, TableView, StopCapture, Horizontal, Vertical, Xaxis, Yaxis). For everything else use `lucide-react`.
- **Canvas**: Konva (react-konva) for image annotation in labeling module
- **i18n**: react-i18next, translations in `public/locales/en/`
- **Path alias**: `@/*` maps to `./src/*`

### ML (`apps/ml`)
- **Training flow**: API POSTs to `/train/` -> ML spawns background `Process` -> trains with luxonis-train -> converts to ONNX -> uploads results back to API via webhook
- **Auth**: API key protection on `/train/` endpoint

### Shared Packages
- **`@repo/database`**: Drizzle schema with UUID PKs, timestamps (createdAt/updatedAt/deletedAt), soft deletes. Entities: user, organization, project, task, projectLabel, model, modelLabel, modelLog, modelOutput, rectangle/polygon/classification annotations
- **`@repo/schema`**: Zod schemas organized by domain (auth, users, organizations, projects, task, model, label). Each domain has `.schema.ts` and `.types.ts`

## Environment Setup

Config files to copy:
```bash
cp apps/api/config.local.example.yml apps/api/config.local.yml
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Key env vars:
- API: `DATABASE_URL`, `GCP_PROJECT`, `SECRETS_PREFIX`
- Web: `VITE_CAMERA_API_BASE_URL`, `VITE_STUDIO_API_BASE_URL`, `VITE_WEB_BASE_URL`
- ML: `PORT`, `WEBHOOK_URL`, `HUBAI_API_KEY`, `API_KEY`

Requires: pnpm v10.28+, Node >= 18, PostgreSQL 16+, Python 3.11 (for ML)

## Deployment

- **GCP Cloud Run**: API and ML services via Cloud Build (`cloudbuild-api.yaml`, `cloudbuild-ml.yaml`)
- **GCP GCS + CDN**: Web static files (`cloudbuild-web.yaml`)
- **Terraform**: Infrastructure in `infra/` (Cloud Run, Cloud SQL, GCS, Artifact Registry, Secret Manager, Load Balancer)
- **Branch triggers**: `dev` -> staging, `master` -> production

## Code Conventions

- Prettier with `prettier-plugin-organize-imports` (auto-sorts imports)
- ESLint flat config; `no-explicit-any` is turned off at root level
- TypeScript strict mode with decorator metadata support (API)
- Zod for all validation (shared via `@repo/schema`), never use class-validator
- **Web UI**: Tailwind v4 utility classes inline (no SCSS modules). For primitives use `@/modules/shadcn/ui/*`; for icons use `lucide-react` first, falling back to `@/components/icons` for brand-specific industrial icons.
