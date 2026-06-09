<p align="center">
  <h1 align="center">Bambu Skills</h1>
</p>

<p align="center">
  A curated collection of <strong>Agent Skills</strong> for AI coding agents, built for the way Bambu developers work.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" />
  <img src="https://img.shields.io/badge/skills-2-7c3aed.svg" alt="Skills: 2" />
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
npx skills add Bambu-Developers/skills/bambu-nest-test
npx skills add Bambu-Developers/skills/bambu-readme-generator
```

Once installed, the agent will leverage each skill automatically when a matching task comes up — no manual invocation required.

## Available skills

| Skill | What it does |
|-------|--------------|
| [**bambu-nest-test**](./bambu-nest-test) | Canonical unit-testing patterns for our NestJS + Prisma monorepo — DTO, service, controller, and module tests. |
| [**bambu-readme-generator**](./bambu-readme-generator) | Regenerates a project's root `README.md` by autodiscovering its real state — language, layout, and scripts. |

### bambu-nest-test

Unit-testing patterns for the Bambu NestJS monorepo. Covers `plainToInstance` + `validate` for DTOs, `Test.createTestingModule` with mocked `PrismaService` and `I18nService` for services, thin-controller delegation assertions, and module DI-wiring verification. Load it when writing or reviewing tests under `apps/<service>/src/` or `libs/<lib>/src/`.

### bambu-readme-generator

Language- and framework-agnostic README generator. It inspects manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, …), maps the repo layout, extracts runnable scripts, and renders a canonical README from a template — treating the existing one as a stale snapshot. Load it when you ask to "generate", "update", or "refresh" the project README.

## Repository layout

```
skills/
├── bambu-nest-test/          # NestJS unit-testing patterns
│   ├── SKILL.md
│   └── rules/                # progressively-disclosed rule files
├── bambu-readme-generator/   # README generator
│   ├── SKILL.md
│   └── templates/            # skeleton + section recipes
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
