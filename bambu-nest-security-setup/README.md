# bambu-nest-security-setup

Skill de Claude Code para **montar o auditar el hardening de runtime de un
backend NestJS**: validación global de DTOs, sanitización de entradas,
rate limiting con `@nestjs/throttler`, CORS, headers de seguridad (helmet/CSP) y
protección CSRF solo cuando aplica.

> **Agnóstica a proyecto e infraestructura.** Está basada en patrones probados de
> un backend Bambú, pero no referencia ningún proyecto, dominio ni destino de
> despliegue. Detecta el stack (Express/Fastify, auth por header o cookie, proxy,
> Redis) y parametriza todo por variables de entorno.

## Cuándo se activa

Frases como: "asegurar el backend", "hardening", "configurar CORS", "agregar
throttler / rate limit", "sanitizar datos", "validaciones de DTOs", "headers de
seguridad", "protección CSRF", "auditar seguridad de la API", o en inglés
"harden the API", "add helmet", "prevent XSS".

## Modos

- **Setup**: verifica las dependencias necesarias (helmet, throttler,
  class-validator, sanitize-html, etc.), instala las que falten con el package
  manager del repo (detectado por el lockfile, con chequeo de compatibilidad de
  peers) y luego aplica los controles que faltan.
- **Audit**: solo lectura (no instala nada); entrega un checklist ✅/⚠️/❌ con
  evidencia, incluidas las dependencias faltantes, y deja que el usuario elija
  qué corregir.

## Estructura

```
bambu-nest-security-setup/
├── SKILL.md                              # metadata + índice + restricciones duras
├── README.md
├── rules/
│   ├── 01-detect-and-audit.md
│   ├── 02-dto-validation.md
│   ├── 03-input-sanitization.md
│   ├── 04-rate-limiting-throttler.md
│   ├── 05-cors.md
│   ├── 06-security-headers.md
│   ├── 07-csrf-protection.md
│   └── 08-verification.md
└── templates/
    ├── bootstrap-security.snippet.md     # main.ts consolidado
    └── env-additions.snippet.md          # variables de entorno + campos Zod
```

## Relación con otras skills

| Skill | Relación |
|-------|----------|
| `bambu-nest-rules` | Complementaria: reglas 03 (env), 04 (DTOs i18n + Swagger), 10 (autorización). Esta skill añade las restricciones de *seguridad* encima. |
| `bambu-security-setup` | Complementaria: escaneo de dependencias (Snyk) en CI. Esta cubre el runtime de la app. |
| `bambu-nest-test` | Úsala junto con esta al escribir los specs de la regla 08. |

## Principios

- Nunca debilitar un control para "que funcione" (`*` en CORS, `unsafe-inline`, quitar `forbidNonWhitelisted`).
- Preguntar antes de endurecer CORS/CSP/validación en un sistema en producción.
- CSRF no se agrega por reflejo: con tokens en header `Authorization` no aplica.
