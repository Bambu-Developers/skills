# Stack annex — Web (Bambú conventions)

For web projects (SPA/SSR frontend, or fullstack). There is no single reference project
as in mobile, so this annex defines the mandatory categories and reasonable defaults:
**confirm the concrete stack with the user in the mode-A interview** and document the
choice in `AGENTS.md`.

## Categories AGENTS.md must fix (with suggested defaults)

| Concern | Suggested default | Stack-independent rule |
|---|---|---|
| Framework | React + Vite, or Next.js if SSR/SEO | One only; version pinned in a committed lockfile |
| Language | Strict TypeScript (`strict: true`) | No silent `any`; API types generated from the OpenAPI if one exists |
| Server state | TanStack Query | API cache/fetch never handwritten in components |
| Client state | Local state first; Zustand/context only if it crosses the tree | Same spirit as hooks-vs-Riverpod: local by default |
| Forms | react-hook-form + zod | Validation with centralized schemas, never ad-hoc checks in JSX |
| Styling/UI | One system (Tailwind + shadcn/ui, or the client's design system) | Never mix systems; centralized design tokens |
| HTTP | A single configured client (fetch wrapper/axios instance) | Base URL from an environment variable, never literal |
| Routing | The framework's | — |
| i18n | Centralized strings from day 0 if the product will need it | Never hardcode copy that will be translated |

## Suggested structure (mirror of the mobile philosophy)

```
src/
  app/ or routes/    # pages/routes — thin composition, no domain logic
  features/<domain>/ # components/ hooks/ api/ types/ per business domain
  shared/            # used by ≥2 features: components/ (chrome), lib/, config/
  config/            # typed env vars validated at boot (zod)
```

- Promotion rule: code is born in its feature; at the second consumer it is promoted to
  `shared/`.
- Pages only compose; logic lives in the feature.
- Per-environment config in `VITE_*`/`NEXT_PUBLIC_*` variables validated at boot — remember
  that **everything exposed to the client is public**: no secrets in the bundle.

## Build and verification

`AGENTS.md` fixes the canonical commands, typically:

```bash
npm run lint        # eslint + prettier check
npm run typecheck   # tsc --noEmit
npm run test        # vitest/jest
npm run build       # production build
```

Green build = all 4 passing. Tests: unit tests for domain logic + at least one E2E test
(Playwright) of the product's critical flow.

## Stack-specific security

- See `rules/08-security-audit.md → Per-project-type specifics → Web` (XSS/CSP, CSRF,
  cookies, headers, CORS, uploads).
- Secrets server-side only; the frontend consumes APIs, it never holds credentials.
- Sanitize any dynamic HTML; `dangerouslySetInnerHTML` requires justification in the PR.
- `npm audit` at every goal closure; lockfile always committed.
