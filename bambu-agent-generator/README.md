# bambu-agent-generator

Skill de Claude Code para **crear subagentes** (`.claude/agents/<nombre>.md`) con la
anatomía de los agentes Bambu, y para **auditar y mejorar el prompt** de los que ya
existen. Todo agente generado queda conectado al protocolo de memoria persistente
(`.claude/agents/memory/`), versionada en git.

## Estructura

```
bambu-agent-generator/
├── SKILL.md                    # flujo: Modo A (crear) y Modo B (mejorar / auditar)
├── references/
│   ├── anatomia.md             # la forma de un agente, sección por sección, con su porqué
│   └── rubrica.md              # criterios de auditoría: señal + arreglo
├── templates/
│   └── AGENT.template.md       # esqueleto a llenar
├── scripts/
│   └── lint-agent.sh           # chequeo estructural determinista (sale 1 ante ERROR)
└── assets/memory/
    ├── memory.sh               # recall / remember / forget / check
    └── PROTOCOL.md             # el protocolo, para repos que todavía no lo tienen
```

## Instalación

```bash
cp -R bambu-agent-generator <tu-proyecto>/.claude/skills/
```

Reinicia Claude Code y confírmalo con `/bambu-agent-generator`.

## Uso

```text
/bambu-agent-generator necesito un agente de code review para PRs de Angular
/bambu-agent-generator mejora el prompt de bambu-qa: dio PASS sin correr el build
/bambu-agent-generator audita todos los agentes
```

Lint directo, sin la skill:

```bash
bash .claude/skills/bambu-agent-generator/scripts/lint-agent.sh .claude/agents/*.md
```

## Límites

- No aplica cambios a un agente existente sin mostrarlos y obtener aprobación.
- No crea un agente cuya frontera se solape con un hermano: propone extender al hermano.
- El lint es estructural; la rúbrica de juicio (disciplina, porqués, contradicciones) la aplica el modelo.

Licencia: MIT · Bambu Tech Services.
