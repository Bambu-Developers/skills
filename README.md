<p align="center">
  <img src="bambu-logo.png" alt="Bambu Tech Services" width="320" />
</p>

<p align="center">
  <h1 align="center">Bambu Skills</h1>
</p>

<p align="center">
  A curated collection of <strong>Agent Skills</strong> for AI coding agents, built for the way Bambu developers work.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" />
  <img src="https://img.shields.io/badge/skills-15-7c3aed.svg" alt="Skills: 15" />
  <img src="https://img.shields.io/badge/agent-Claude%20Code-d97757.svg" alt="Claude Code" />
</p>

---

## What are skills?

**Agent Skills** are packaged instructions that extend the capabilities of AI coding agents (such as Claude Code). Each skill teaches the agent how to perform a specific task following Bambu's conventions — so that generated code, tests, and docs match what the rest of the team would write by hand.

An agent loads a skill automatically when it detects a relevant task. Skills override generic, framework-default advice whenever they conflict with our house style.

## Installation

Install the entire collection:

```bash
npx skills add Bambu-Developers/skills
```

Or install an individual skill by name:

```bash
npx skills add Bambu-Developers/skills/bambu-agent-generator
npx skills add Bambu-Developers/skills/bambu-angular-file-architecture
npx skills add Bambu-Developers/skills/bambu-e2e-test-matrix
npx skills add Bambu-Developers/skills/bambu-git-flow
npx skills add Bambu-Developers/skills/bambu-nest-api-guide
npx skills add Bambu-Developers/skills/bambu-nest-rules
npx skills add Bambu-Developers/skills/bambu-nest-test
npx skills add Bambu-Developers/skills/bambu-playwright-qa-e2e
npx skills add Bambu-Developers/skills/bambu-readme-generator
npx skills add Bambu-Developers/skills/bambu-security-setup
npx skills add Bambu-Developers/skills/bambu-snyk-dependency-hardening
npx skills add Bambu-Developers/skills/bambu-spec-define
npx skills add Bambu-Developers/skills/bambu-spec-implement
npx skills add Bambu-Developers/skills/bambu-terraform-aws
npx skills add Bambu-Developers/skills/bambu-worktree
```

Once installed, the agent will leverage each skill automatically when a matching task comes up — no manual invocation required.

> **`bambu-e2e-test-matrix` needs one extra setup step.** Unlike the other skills, it drives a real browser and records video through the **Playwright MCP**, so it requires a one-time MCP configuration. After installing, run its bundled setup script once (it pins `@playwright/mcp@0.0.68` with `--save-video` and optionally registers its sub-agents):
>
> ```bash
> bash bambu-e2e-test-matrix/scripts/setup.sh
> ```
>
> Then verify with `/mcp` that `playwright` is connected. See [`bambu-e2e-test-matrix/README.md`](./bambu-e2e-test-matrix/README.md) for the manual equivalent and the optional Figma/SAST tooling.

## Available skills

| Skill | What it does |
|-------|--------------|
| [**bambu-agent-generator**](./bambu-agent-generator) | Creates Claude Code subagents (`.claude/agents/<name>.md`) with the Bambu agent anatomy — least-privilege tools, a central auditable discipline, a deliverable with fixed structure, and git-versioned persistent memory — and audits/improves existing agent prompts against a rubric, proposing changes as a diff. |
| [**bambu-angular-file-architecture**](./bambu-angular-file-architecture) | Defines and maintains the file architecture of a standalone Angular app — four layers (`core/`, `shared/ui/`, `layouts/`, `features/`) with a verifiable membership rule each, lazy loading per area, repository as interface + `InjectionToken`, and business rules as pure functions outside Angular. |
| [**bambu-e2e-test-matrix**](./bambu-e2e-test-matrix) | Generates and runs manual E2E test matrices (flow, usability, visual, accessibility, edge cases) against any web app via Playwright MCP — batch execution with continuous video evidence, optional Figma diffs and SAST security analysis, and a final scoring/ranking. |
| [**bambu-git-flow**](./bambu-git-flow) | Creates branches and opens draft PRs per Bambu's internal Branching Strategy Policy — infers type/base, validates the naming convention, runs the policy's pre-checks, and sets the right merge method and version label. |
| [**bambu-nest-api-guide**](./bambu-nest-api-guide) | Diffs a git range in our NestJS + Prisma monorepo, classifies every touched endpoint (new/modified/removed, breaking vs. additive), and publishes a frontend-facing API integration guide as an Artifact. |
| [**bambu-nest-rules**](./bambu-nest-rules) | Project-specific conventions for our NestJS + Prisma monorepo — dynamic-module libs, Secrets Manager, typed envs, i18n, error handling, DI, and thin controllers. |
| [**bambu-nest-test**](./bambu-nest-test) | Canonical unit-testing patterns for our NestJS + Prisma monorepo — DTO, service, controller, and module tests. |
| [**bambu-playwright-qa-e2e**](./bambu-playwright-qa-e2e) | Generates and updates automated Playwright E2E specs for a critical flow or component in any web framework — confirms selectors and behavior against the real UI first, covers a systematic field-type edge-case catalog, and handles authenticated flows via `storageState`. |
| [**bambu-readme-generator**](./bambu-readme-generator) | Regenerates a project's root `README.md` by autodiscovering its real state — language, layout, and scripts. |
| [**bambu-security-setup**](./bambu-security-setup) | Bootstraps (or audits) Snyk dependency-scanning CI for any repo — detects package manager/stack, generates the blocking GitHub Actions workflow plus weekly schedule, `.snyk` CODEOWNERS, `SNYK_TOKEN` secret, and security-team repo access. |
| [**bambu-snyk-dependency-hardening**](./bambu-snyk-dependency-hardening) | Portable decision framework for triaging and remediating Snyk (or equivalent SCA) findings in third-party dependencies — upgrade vs. documented exception, verifying an upgrade is actually safe, and writing well-formed `.snyk` ignore entries with severity-based expiration. |
| [**bambu-spec-define**](./bambu-spec-define) | The slow half of a spec-driven-design flow — Socratic, section-by-section authoring of a `SPEC NN` contract (context, goals, non-goals, requirements, interfaces, edge cases, acceptance criteria), with a Draft→In review→Approved→Implemented→Obsolete lifecycle gate — plus a `STATE.md` board that indexes every spec, graphs their dependencies, and says what's ready to implement and what's blocked. |
| [**bambu-spec-implement**](./bambu-spec-implement) | The fast half of that same flow — refuses to start unless the spec (and its dependencies) is Approved, executes its contract as written with no re-litigating design, and flips it to Implemented on completion. |
| [**bambu-terraform-aws**](./bambu-terraform-aws) | Reusable, project-agnostic conventions for generating, modifying, and reviewing Terraform infrastructure on AWS — modules, environments, networking, security groups, tagging, and the interchangeable compute layer. |
| [**bambu-worktree**](./bambu-worktree) | Creates an isolated `git worktree` under `.worktrees/<feature>/` with its own branch, from a short requirement description or an explicit branch name, to work on several things in parallel without repeated stash/checkout. |

### bambu-agent-generator

Creates new Claude Code subagents and audits existing ones, so every agent in a repo follows the same Bambu anatomy without anyone having to remember it. In **create mode** it reads the sibling agents first (occupied boundaries, colors, whether the memory protocol is installed), interviews for role, start/end condition, boundary, the role's most expensive mistake, deliverable, tools and autonomy, then turns that most expensive mistake into a **central discipline** — a mandatory classification that has to show up in the deliverable (e.g. DICHO / INFERIDO / SUPUESTO / DESCONOCIDO for an analyst, PASS / FAIL / NO VERIFICABLE AQUÍ / BLOQUEADO for QA) — and drafts the agent from `templates/AGENT.template.md`: least-privilege `tools` derived from the steps, a rule-with-its-why style, nothing that rots in the prompt, and a fixed Step 0 `recall` / last-step `remember` wired to a git-versioned memory protocol (`assets/memory/memory.sh` + `PROTOCOL.md`, installed into the repo if missing). In **improve mode** it gathers evidence (the prompt, the agent's memory, its git history, a concrete misbehavior), runs `references/rubrica.md` (trigger/boundary, discipline, instructions, tools/autonomy, memory, cross-agent checks) and proposes minimal fixes as a diff — never applying them without approval. Ships `scripts/lint-agent.sh`, a deterministic structural check (frontmatter, required sections, memory wiring, declared vs. used tools, cited memory slugs). Written in Spanish. Load it when you ask to "create an agent", "I need a subagent for…", "improve this agent's prompt", "this agent keeps getting X wrong", "audit the agents", or mention `.claude/agents/` explicitly.

### bambu-angular-file-architecture

Domain- and design-system-agnostic file architecture for standalone Angular apps (v17+, ideally v20+). Its premise is that **where a file lives is a design decision, not a matter of taste**: four layers — `core/` (singleton infrastructure plus the domain module), `shared/ui/` (design-system primitives with no business state), `layouts/` (route shells) and `features/` (screens and routes) — each with a membership rule you can verify, and an explicit dependency direction that is what keeps the lazy chunks separate. Covers the domain-module pattern that stops "there's no backend yet" from becoming a rewrite (`*.model.ts` types, `*.rules.ts` pure functions with catalogs passed in as parameters, `*.repository.ts` interface + `InjectionToken`, and a single mock implementation as the only file that knows the backend), one lazy `*.routes.ts` per area with guards on the parent route, file-naming rules (no `.component.ts` suffix, specs next to the file), and a single barrel for the whole project. Ships `scripts/scaffold-architecture.sh` to create the skeleton in a new project (parameterized by selector prefix, domain, and areas; idempotent, never overwrites) and `references/review-checklist.md` with eleven checks, each with the `grep` that detects the violation. Load it when starting a new Angular project, when deciding where a new file goes ("does this component go in shared or features?"), or when reviewing/refactoring a structure that already drifted (business components in `shared/`, logic inside components, cross-layer imports, barrels breaking the lazy chunks).

### bambu-e2e-test-matrix

Generic, self-contained skill for **manual E2E QA** on any web application. It runs in two phases: first it explores the site (and optionally the source repo, read-only) and proposes a test matrix (`matriz-pruebas.csv`) covering functional, flow, usability, visual, accessibility, and edge/negative cases — then, only after you approve it, it executes. Execution is delegated to sub-agents batch by batch (one module per `e2e-runner`; the orchestrator only coordinates, never navigates), records **one continuous video per module** as evidence, checkpoints progress to `ESTADO-CORRIDA.md` so a run can resume where it left off, and enforces a completeness gate so no approved case is silently left pending. It can optionally diff screens against a **Figma** design and run static **SAST** security analysis (OWASP Top 10, CWE Top 25, hardcoded secrets, dependency CVEs), and closes with a 0–100 score, letter grade, and per-module ranking. Everything is saved locally; it **never modifies** the code of the app under test. Requires the Playwright MCP (see the extra setup step under [Installation](#installation)). Load it when you ask for an "E2E test matrix", "flow/usability testing", "test a site", "video test evidence", "compare the UI against Figma", or "SAST/security analysis of the code".

### bambu-git-flow

Creates branches and opens Pull Requests in any Bambu repo following the internal **Branching Strategy Policy** (v0.1, draft): infers the branch type (feature/fix/hotfix/refactor/chore/docs), picks the right base (`dev`, or `main` for hotfixes), validates the `<type>/<module>-<description>[-<ticket>]` naming convention (kebab-case, ≤ 50 chars) via a bundled script, and opens the PR as a **draft** with the destination, merge method, and version label (`major`/`minor`/`patch`) that the integration type calls for — running the policy's pre-checks first (open-PR count, diff size, oversized files) so the pipeline doesn't reject them later. Also covers hotfixes from `main`, `dev → qa → main` promotions, `main → qa → dev` sync-downs, and diagnosing an existing branch name or PR against the policy. It never merges, approves, force-pushes, or bypasses branch protections — those stay human decisions. Load it when you ask to "create a branch for…", "open the PR", "hotfix for…", "promote dev to qa", "sync main to dev", or "check my branch name".

### bambu-nest-api-guide

Read-only-on-git skill for the Bambu NestJS + Prisma monorepo. Resolves a git comparison range (explicit, or auto-detected via upstream/merge-base against long-lived branches), diffs controllers and DTOs, classifies every touched endpoint as new/modified/removed, flags breaking vs. additive changes against a fixed taxonomy (removed/renamed response fields, request fields turned required, changed types, removed enum values, stricter auth guards, changed success status codes, …), and publishes the result as a frontend-facing API integration guide via the `Artifact` tool — breaking changes surfaced first, both in the artifact and in the chat summary. Load it when you ask to "generate the API guide for frontend", "document what changed in the API for this PR", or "what does this change break for frontend".

### bambu-nest-rules

Project-specific conventions for the Bambu NestJS monorepo. Covers `forRoot`/`forRootAsync` dynamic modules in libs, AWS Secrets Manager integration, typed envs via `config/env.config.ts`, DTOs with i18n validation, `I18nModule` setup in apps, service-layer error handling with `I18nService.t(...)`, `PrismaService` usage, constructor-based dependency injection, and thin controllers. Load it when writing, reviewing, or refactoring any code under `apps/<service>/` or `libs/<lib>/`. Pairs with **bambu-nest-test** so tests mirror the implementation conventions.

### bambu-nest-test

Unit-testing patterns for the Bambu NestJS monorepo. Covers `plainToInstance` + `validate` for DTOs, `Test.createTestingModule` with mocked `PrismaService` and `I18nService` for services, thin-controller delegation assertions, and module DI-wiring verification. Load it when writing or reviewing tests under `apps/<service>/src/` or `libs/<lib>/src/`.

### bambu-playwright-qa-e2e

Generates (and updates) automated Playwright E2E suites for any web app — Angular, React, Vue, Next.js, or a framework the model doesn't recognize out of the box — from a critical flow described by the user or a specific component/screen. Detects the project's framework deterministically (`scripts/detect-framework.sh`) before assuming conventions, then confirms every selector and behavior against the real UI (via Playwright MCP or the dev server) before writing a single spec — accessible names, the exact condition under which each error message appears, debounce/autosave races, framework-specific synthetic-event gotchas (React controlled inputs, Vue `v-model`, Angular Signal Forms). Builds the case matrix from a field-type edge-case catalog (invalid email format, letters in a numeric/phone field, max length, out-of-range dates, selects with no valid option) rather than only the obvious happy path, and writes Page Objects with role/accessible-name locators — never `data-testid` unless the project already uses it. Handles flows behind login via the `storageState` pattern (a real test session, never invented credentials). Complementary to **bambu-e2e-test-matrix**, not a replacement: that skill is a manual QA orchestrator that explores and scores an app through Playwright MCP; this one authors the versioned Playwright regression suite a project's own CI actually runs. Never does real Component Testing (`mount()` + gallery) — refers to the official Microsoft skill for that when the framework supports it. Load it when you ask to "generate E2E tests for...", "test this flow", "add test cases for the login/checkout/X form", "cover the edge cases of this form", or want a component change to never silently break another part of the app.

### bambu-readme-generator

Language- and framework-agnostic README generator. It inspects manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, …), maps the repo layout, extracts runnable scripts, and renders a canonical README from a template — treating the existing one as a stale snapshot. Load it when you ask to "generate", "update", or "refresh" the project README.

### bambu-security-setup

Portable bootstrap for Snyk dependency-scanning CI on any repo — backend or frontend, monorepo or single package, npm/yarn classic/yarn berry/pnpm/bun. Detects the package manager, runtime, monorepo layout, and protected branches before writing anything, then generates a GitHub Actions workflow that blocks PRs on high/critical vulnerabilities and runs weekly on its own, plus a `.snyk` CODEOWNERS line. Also walks through the governance steps that need explicit confirmation: security-team repo access, the `SNYK_TOKEN` secret, and what's left to configure manually (branch protection). Load it when you ask to "add Snyk", "set up security scanning", "replicate the security workflow to another repo", or "set the SNYK_TOKEN".

### bambu-snyk-dependency-hardening

Generic, project-agnostic decision framework for triaging vulnerability findings reported by Snyk or an equivalent SCA tool (`npm audit`, etc.) in third-party dependencies. For each finding it walks a fixed decision tree: check whether a safe upgrade exists (verifying real breaking changes and toolchain compatibility — e.g. an ESM/CJS mismatch — not just the advisory text, then running the tests of every real consumer); if not, judge real exploitability at the actual call site rather than trusting the advisory; and if genuinely non-exploitable, document a well-formed `.snyk` ignore entry with a technical `reason` and an `expires` date set by severity (7 days for Critical/High, 30 days for Medium/Low). It also covers gating changes to the ignore-policy file behind CODEOWNERS. It never lowers the scanner's severity threshold and never commits/pushes on its own. Load it when a Snyk/SCA check fails, when deciding upgrade vs. exception for a vulnerable dependency, or when writing/reviewing a `.snyk` policy change.

### bambu-spec-define

The deliberately slow half of a spec-driven-design flow: before any code is written, it authors and maintains a `SPEC NN` file as the contract that later execution follows. Works section by section against `templates/SPEC.template.md`, using `templates/section-recipes.md` as a Socratic checklist — Context, Goals, Non-goals, Dependencies, Functional requirements, Interfaces & contracts, Non-functional requirements, Edge cases, Acceptance criteria, Risks, Open questions — pushing back on vague answers instead of auto-filling from code (there usually isn't any yet). Assigns the sequential `SPEC NN` number, validates `Depends on:` cross-references, and owns the status lifecycle (Draft → In review → Approved → Implemented → Obsolete, English or Spanish labels accepted and normalized on write), refusing to self-approve or to let a non-empty Open Questions section reach Approved. It also maintains the repo's `STATE.md` board next to the specs: a generated half (status table, summary, *ready to implement*, *blocked* with the blocker named, critical path, and a dependency graph — ASCII always, Mermaid only once the graph earns it) rebuilt in full from the spec files on every spec creation and every status change, and a hand-written half (`## Reading the board`, plus an optional project-notes appendix) preserved verbatim across regenerations. Because a snapshot goes stale on its own, it ships `scripts/state-check.sh`, a read-only check that compares every row against its file's real `> **Status:**` and flags specs with no row, rows with no file, and broken or obsolete dependencies — if a row and a file disagree, the file wins. Never writes application code — that handoff goes to **bambu-spec-implement** once a spec is Approved. Load it when you ask to "write a spec for…", "let's spec out…", "send this spec to review", "approve SPEC 04", "how are we doing on the specs?", "what can I implement right now?", "update the STATE", or mention a `SPEC NN` / `specs/` file explicitly.

### bambu-spec-implement

The fast half of the same flow: consumes an Approved `SPEC NN` as its contract and executes it, without re-litigating decisions the spec already made. Hard-refuses to start against a spec that isn't Approved (Draft, In review, Obsolete) — or whose `Depends on:` references aren't themselves Approved/Implemented — and reports exactly what's missing instead of proceeding on a best-effort basis. Treats Interfaces & contracts, Functional requirements, and Edge cases as the literal spec to build, Non-goals as out of bounds even mid-implementation, and Acceptance criteria as the checklist it verifies against before reporting done. On completion, writes back only the Status line (`Approved` → `Implemented`) plus a one-line PR/commit reference, and updates that spec's row — and only that row — in the `STATE.md` board, since this is the transition where the board goes stale most easily: it happens outside the skill that owns it. It never edits a spec's substantive sections; a gap found later becomes a new spec, not a silent rewrite. Pairs with **bambu-spec-define**. Load it when you ask to "implement SPEC 04", "build SPEC 04", or there's an Approved spec ready to execute.

### bambu-terraform-aws

Reusable, project-agnostic conventions for Terraform on AWS. Covers module and environment structure, naming, two-layer tagging, `for_each`/`count` iteration and deterministic outputs, a 3-layer VPC with private data tiers, one-SG-per-component security groups with SG-to-SG references, a non-negotiable Well-Architected security baseline (private networking, encryption, secrets, least-privilege IAM), and an interchangeable application/compute layer (Lambda / Fargate / EC2 / EKS) on a common base. Load it when creating or reviewing modules under `modules/` or environments under `environments/`, wiring the VPC, subnets, or security groups, or choosing/switching the compute layer.

### bambu-worktree

Project-agnostic skill that creates an isolated `git worktree` under `.worktrees/<feature>/`, with its own branch, from a short requirement description (auto-slugified to kebab-case) or an explicit branch/folder name the user already has in mind. Detects the repo's real default branch instead of hardcoding `develop`/`main`, guards against folder/branch name collisions before creating anything, and makes sure `.worktrees/` is gitignored in the target repo. Load it when you ask to "create a worktree", "work on multiple things in parallel", "isolate this feature in its own folder", or "give me a separate checkout for X".

## Repository layout

```
skills/
├── bambu-agent-generator/    # create / audit Claude Code subagents
│   ├── SKILL.md
│   ├── README.md
│   ├── references/           # agent anatomy + audit rubric
│   ├── templates/            # AGENT.template.md
│   ├── scripts/              # lint-agent.sh
│   └── assets/memory/        # memory.sh + PROTOCOL.md (persistent agent memory)
├── bambu-angular-file-architecture/  # file architecture for standalone Angular apps
│   ├── SKILL.md
│   ├── README.md
│   ├── references/           # domain module + routing/chunks + review checklist
│   └── scripts/              # scaffold-architecture.sh
├── bambu-e2e-test-matrix/    # manual E2E QA (Playwright MCP)
│   ├── SKILL.md
│   ├── scripts/              # setup.sh — one-time Playwright MCP config
│   ├── references/           # browser/visual/a11y/SAST guides + agents/ profiles
│   └── assets/templates/     # matriz-pruebas.csv · ESTADO-CORRIDA.md · reporte.md
├── bambu-git-flow/           # branch/PR creation per Bambu's branching policy
│   ├── SKILL.md
│   ├── references/            # full policy rules + v0.1 open points
│   ├── assets/                 # PR description template
│   └── scripts/                 # validate-branch-name.sh · create-branch.sh · create-pr.sh
├── bambu-nest-api-guide/     # frontend API integration guide (git diff → Artifact)
│   ├── SKILL.md
│   └── references/            # API-relevant-files detection + breaking-change taxonomy
├── bambu-nest-rules/         # NestJS project conventions
│   ├── SKILL.md
│   └── rules/                # progressively-disclosed rule files
├── bambu-nest-test/          # NestJS unit-testing patterns
│   ├── SKILL.md
│   └── rules/                # progressively-disclosed rule files
├── bambu-playwright-qa-e2e/  # automated Playwright E2E spec authoring
│   ├── SKILL.md
│   ├── README.md
│   ├── references/           # framework detection + edge cases + page objects + auth routes
│   └── scripts/              # detect-framework.sh
├── bambu-readme-generator/   # README generator
│   ├── SKILL.md
│   └── templates/            # skeleton + section recipes
├── bambu-security-setup/     # Snyk dependency-scanning CI bootstrap
│   ├── SKILL.md
│   ├── references/           # package-manager detection + GitHub governance
│   └── assets/                # workflow + CODEOWNERS templates
├── bambu-snyk-dependency-hardening/  # Snyk/SCA dependency triage & remediation
│   ├── SKILL.md
│   └── README.md              # how the skill triggers (auto vs. explicit)
├── bambu-spec-define/        # spec-driven design — slow half (spec authoring + state board)
│   ├── SKILL.md
│   ├── README.md
│   ├── templates/            # SPEC + STATE skeletons, Socratic section recipes, board recipes
│   └── scripts/              # state-check.sh — board vs. spec files
├── bambu-spec-implement/     # spec-driven design — fast half (execution)
│   ├── SKILL.md
│   └── README.md
├── bambu-terraform-aws/      # Terraform/AWS infrastructure conventions
│   ├── SKILL.md
│   └── rules/                # progressively-disclosed rule files
├── bambu-worktree/           # isolated git worktree creation
│   ├── SKILL.md
│   └── README.md              # install + usage examples
└── CLAUDE.md                 # guidance for agents working in THIS repo
```

Each skill is a self-contained directory whose `SKILL.md` carries YAML frontmatter (`name`, `description`) plus instructions for the agent. Supporting `rules/` and `templates/` files are loaded on demand.

## Contributing a new skill

1. Create a directory named after the skill (kebab-case).
2. Add a `SKILL.md` with `name` (must match the directory) and a `description` that enumerates concrete trigger phrases — the description is the only thing the agent sees when deciding whether to load the skill.
3. Keep `SKILL.md` as an index; push detail into numbered `rules/*.md` or `templates/*.md` files.
4. Write instructions for a future agent, not end-user docs: when to load, how to apply step by step, and the hard constraints.

See [`CLAUDE.md`](./CLAUDE.md) for the full authoring conventions.

## License

[MIT](./LICENSE) © Bambu Tech Services
