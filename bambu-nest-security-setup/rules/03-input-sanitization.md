# 03 — Sanitize untrusted input (on write), safe queries, safe uploads

Validation says "is this shaped correctly"; sanitization says "is this safe to store and later render". Both are needed. **Sanitize on write** (before persisting) — not only when rendering — so stored XSS can't reach any consumer (web, mobile, emails, PDFs, admin panels).

## Decide per field

| Field kind | Treatment |
|------------|-----------|
| Identifiers, enums, numbers, dates | Validation only (rule 02) |
| Plain text (name, title, comment) | `@Transform` trim + strip tags/control chars; validate length after transform |
| Rich text / HTML from an editor | Allowlist sanitizer (below) |
| Passwords, tokens, secrets, signatures | **Never** sanitize or trim — it alters the secret |
| URLs | `@IsUrl` with `protocols: ['https']` (+`http` if needed); reject `javascript:`/`data:` |
| Filenames | Never use the client filename for storage paths; generate a server-side name |

## Canonical pattern — plain text

```ts
// common/utils/sanitize-text.util.ts
import sanitizeHtml from 'sanitize-html';

/** Removes every tag and attribute; returns trimmed text without control chars. */
export function sanitizePlainText(input?: string | null): string {
  if (!input) return '';
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

// common/decorators/sanitize.decorator.ts
import { Transform } from 'class-transformer';
export const SanitizeText = () =>
  Transform(({ value }) => (typeof value === 'string' ? sanitizePlainText(value) : value));
```

```ts
export class CreateCommentDto {
  @SanitizeText()                       // runs before validators (transform: true)
  @IsString() @IsNotEmpty() @MaxLength(500)
  text!: string;
}
```

Note: `sanitize-html` entity-escapes `&`, `<`, `>`; if the product stores text that legitimately contains them, decide whether to store escaped or decode once at the edge — be consistent and document it.

## Canonical pattern — rich text (allowlist)

```ts
// common/utils/sanitize-rich-text.util.ts
import sanitizeHtml from 'sanitize-html';

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p','br','strong','b','em','i','u','s','ul','ol','li','a','h1','h2','h3','h4','blockquote','hr','table','thead','tbody','tr','th','td'],
  allowedAttributes: { a: ['href', 'target', 'rel'], '*': ['class'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],        // blocks javascript:/data:
  allowProtocolRelative: false,
  transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
};

export function sanitizeRichText(input?: string | null): string {
  return input ? sanitizeHtml(input, RICH_TEXT_OPTIONS) : '';
}
```

- Prefer an **allowlist**; never a blocklist of "bad" tags.
- Do **not** allow the `style` attribute unless a real need exists (CSS can exfiltrate/overlay); if allowed, restrict with `allowedStyles`.
- Call it in the service/DTO transform **before** persisting. Add a spec that feeds `<script>`, `onerror=`, `javascript:` and asserts they're gone.
- If a library version must be pinned (ESM-only majors vs. a CJS test runner), pin it exactly and comment the reason next to the dependency's usage.

## Injection

- **ORM/SQL**: use the ORM's parameterized API. With Prisma, only tagged `prisma.$queryRaw\`...${value}\``; **`$queryRawUnsafe` / `$executeRawUnsafe` or string-concatenated SQL is forbidden** unless the interpolated parts are whitelisted constants (e.g. a sort column from a closed enum).
- **Dynamic sort/filter fields**: map from a closed enum to the column; never pass the client string as a column/operator.
- **NoSQL (Mongo)**: reject objects where strings are expected (`@IsString()`), so `{ "$ne": null }` can't reach the query.
- **Command execution / paths**: never build shell commands or file paths from user input.
- **SSRF**: any server-side fetch of a user-supplied URL needs an allowlist of hosts and a block on private/link-local ranges.
- **Logs**: don't log raw bodies containing credentials/PII; strip CR/LF from user strings before logging (log injection).
- **Emails/PDF/HTML templates**: escape interpolated user values (template engine autoescape on; no triple-stash/`| safe` on user data).

## Canonical pattern — file uploads

```ts
// controller
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 } }))
upload(@UploadedFile(new FileValidationPipe()) file: Express.Multer.File) { ... }
```

```ts
// common/pipes/file-validation.pipe.ts
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];  // NO image/svg+xml by default

@Injectable()
export class FileValidationPipe implements PipeTransform {
  async transform(file?: Express.Multer.File) {
    if (!file) throw new BadRequestException(/* i18n key */);
    // 1) detect from CONTENT (magic bytes), not from the client-declared mimetype/extension
    const { fileTypeFromBuffer } = await import('file-type');   // pin a version compatible with the repo's module system
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED.includes(detected.mime)) throw new BadRequestException(/* i18n key */);
    // 2) never trust file.originalname: generate the stored name server-side
    return file;
  }
}
```

- Size limit goes in **multer `limits`** (aborts the stream early) *and* a global filter maps multer's `LIMIT_FILE_SIZE` (surfaces as `PayloadTooLargeException`) to a localized 413.
- `image/svg+xml` is script-capable: reject it, or sanitize server-side and serve with `Content-Disposition: attachment` + `Content-Type` fixed.
- Store uploads outside the web root / in object storage with non-guessable keys; serve with `X-Content-Type-Options: nosniff` (helmet sets it).
- Memory storage + big limits = memory DoS; keep limits tight or stream to disk/object storage.
