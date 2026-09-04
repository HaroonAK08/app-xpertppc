# Lead SaaS CRM MVP

Production-minded, mobile-first, multi-tenant CRM for Meta Lead Ads and supported Messenger replies. One Expo app serves many isolated organizations; PostgreSQL is the source of truth and slow provider work runs through BullMQ workers.

## What is implemented

- Signup/login/logout, rotating refresh sessions, revocation, password recovery, organization creation/switching, invitations, OWNER/ADMIN/MANAGER/AGENT/VIEWER authorization.
- Tenant-scoped leads, contacts, statuses, assignments, notes, tags, activities, cursor pagination, search/filter/sort, dashboard, audit records, plan/usage data, and automation-lite rules.
- Server-owned Meta OAuth, encrypted credentials, Page/Form discovery and selection, signed webhook verification, durable webhook idempotency, async lead fetch/normalization/deduplication, integration health, and queue failure visibility.
- Separate Lead and Conversation models; async incoming Messenger persistence; policy-window-aware outgoing replies; visible PENDING/SENT/FAILED state and retry of the same persisted message.
- Expo push registration/delivery, organization-scoped Socket.IO rooms, reconnect refetch, per-user reads/unread inbox, and authorization-safe deep links.
- Expo mobile screens for authentication/recovery, Meta onboarding, dashboard, lead list/detail, inbox/conversations, team/tags/settings, invitation acceptance, and organization switching.
- Internal admin overview, request IDs, safe error envelopes, validation, rate limiting, structured logs, health/readiness, Nginx, Compose, migration, load drivers, and automated security/unit tests.

Meta’s current contract and verified official references are recorded in `docs/meta-integration-contract.md`. The Graph version and permissions are configuration, not invented constants.

## Local run

Requirements: Node 24+, Corepack/pnpm 11, and Docker Compose.

1. Copy `.env.example` to `.env` and replace every secret/configuration placeholder. Generate independent high-entropy auth secrets and a 32-byte encryption key.
2. Set `META_GRAPH_VERSION` to the currently supported, verified Graph API version and configure the Meta app callback/webhook URLs.
3. Configure `MAIL_DELIVERY_URL`, `MAIL_DELIVERY_TOKEN`, and `MAIL_FROM`. The mail gateway receives `{ from, to, template, variables }` and must render `PASSWORD_RESET` and `ORGANIZATION_INVITATION` templates.
4. Run `docker compose up --build`. Compose waits for PostgreSQL, applies Prisma migrations once, then starts API, worker, Redis, and Nginx.
5. Open the API through `http://localhost:8080`; health endpoints are `/health` and `/health/ready`. The internal admin shell is `/admin/`.
6. In another terminal run `corepack pnpm --filter @lead-saas/mobile dev`; set the mobile API base for the device/emulator as needed.

Never use the development database password or placeholder secrets in a deployed environment. Terminate TLS at the load balancer/reverse proxy, use managed PostgreSQL/Redis, restrict network access, and store secrets in the platform’s secret manager.

## Provider configuration

- Meta: app ID/secret, redirect URI, webhook verification token, current Graph version/scopes, Lead Ads webhook subscription, app review, Page permissions, privacy/data-deletion configuration, and test Page/Form.
- Push: Expo project configuration plus APNs/FCM credentials; `EXPO_ACCESS_TOKEN` is optional when enhanced push security is disabled.
- Email: authenticated HTTPS delivery gateway as described above.
- Billing/error tracking: adapter keys are present but commercial account activation is deployment-specific.

No provider token is returned to mobile or logged. Messenger replies are only attempted for real Messenger conversations and within the standard reply window implemented by the adapter.

## Verification

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
DATABASE_URL=postgresql://lead_saas:lead_saas@localhost:5432/lead_saas corepack pnpm build
DATABASE_URL=postgresql://lead_saas:lead_saas@localhost:5432/lead_saas corepack pnpm --filter @lead-saas/database exec prisma validate
```

Runtime acceptance after Compose is healthy:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/health/ready
API_BASE_URL=http://localhost:8080 ACCESS_TOKEN='<tenant token>' corepack pnpm load:api
API_BASE_URL=http://localhost:8080 META_WEBHOOK_VERIFY_TOKEN='<token>' corepack pnpm load:webhook
```

Before production, run the full acceptance flow with two real test organizations and a Meta staging app: signup → invite/accept → connect Meta → select Page/Form → signed webhook → async lead → push/realtime → assignment/status/note/tag → real supported conversation → send/fail/retry. Confirm Organization A cannot read or mutate every Organization B resource. Load drivers live in `infra/scripts`.

## Important deployment boundary

The codebase is ready for a configured staging run, but third-party activation cannot be embedded in source control: real Meta app review/credentials, APNs/FCM, mail gateway, billing account, DNS/TLS, and managed infrastructure must be supplied by the deployment owner. Do not call the product production-complete until that live acceptance checklist passes.
