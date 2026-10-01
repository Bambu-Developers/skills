# bambu-nest-rules

Skill de Claude Code con las **convenciones específicas del monorepo Bambu_Backend**
(NestJS + Prisma): módulos dinámicos en libs, AWS Secrets Manager, envs tipados,
DTOs con i18n, manejo de errores, inyección de dependencias y controladores
delgados. Estas reglas **pisan** cualquier consejo genérico de NestJS cuando
entran en conflicto.

> Es específico de ese repo *consumidor* — no de este repositorio de skills.

## Estructura (auto-contenida)

```
bambu-nest-rules/
├── SKILL.md                            # metadata + índice de reglas + resumen de 10 líneas
└── rules/
    ├── 01-libs-dynamic-modules.md
    ├── 02-secrets-manager.md
    ├── 03-env-config.md
    ├── 04-dtos-with-i18n.md
    ├── 05-i18n-setup.md
    ├── 06-service-error-handling.md
    ├── 07-prisma-usage.md
    ├── 08-dependency-injection.md
    ├── 09-thin-controllers.md
    ├── 10-main-vs-serverless.md
    └── 11-exception-filters.md
```

## Instalación

Copia esta carpeta al repo Bambu_Backend donde Claude Code detecta skills:

```bash
# A nivel usuario (sirve para todos tus proyectos)
cp -R bambu-nest-rules ~/.claude/skills/

# …o a nivel proyecto (recomendado para este skill, es específico del monorepo)
cp -R bambu-nest-rules <Bambu_Backend>/.claude/skills/
```

Reinicia Claude Code y confírmalo escribiendo `/bambu-nest-rules`.

## Uso

El skill se carga automáticamente — no hace falta invocarlo por nombre — en
cuanto el trabajo toca el monorepo, por ejemplo:

- *"Crea un microservicio nuevo en `apps/staff`."*
- *"Agrega un endpoint que reciba un `UpdateProfileDto`."*
- *"Necesito guardar un secreto nuevo para el cliente de SES."*
- *"Revisa este PR contra las convenciones del repo."*
- *"¿Cómo registro un error tipado del SDK de Cognito?"*

También puedes invocarlo explícitamente con `/bambu-nest-rules` antes de pedir
el cambio, si quieres forzar que relea las reglas primero.

Carga siempre junto con `bambu-nest-test` cuando el cambio también necesita
tests (la skill de tests debe reflejar estas mismas convenciones).

## Reglas clave (ver tabla completa en `SKILL.md`)

1. Libs exponen `forRoot` / `forRootAsync`.
2. Secretos vía AWS Secrets Manager, cableados en `forRootAsync`.
3. Env vars tipadas y validadas en `config/env.config.ts`.
4. DTOs obligatorios, cada validator con su key de i18n.
5. Apps HTTP bootstrapean `I18nModule.forRoot` + `I18nValidationPipe`.
6. Servicios lanzan excepciones con mensajes de `I18nService.t(...)`.
7. Acceso a datos solo vía `PrismaService` de `@app/prisma`.
8. Dependencias inyectadas por constructor, nunca `process.env` directo.
9. Controladores: una línea, delegan al servicio.
10. `main.ts` y `serverless.ts` comparten la misma configuración.
11. Errores tipados de SDKs externos se mapean con `@Catch` + `APP_FILTER` + i18n.

Licencia: MIT · Bambu Tech Services.
