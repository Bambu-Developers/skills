# 08 — Verify the controls actually work

A control that isn't tested silently regresses. After setup (or as part of an audit) run these checks and report results faithfully — including failures.

## Manual checks (running app, replace `$API` and `$ORIGIN`)

```bash
# 1) Security headers present, banner gone
curl -sI "$API/health" | grep -iE 'content-security-policy|strict-transport-security|x-content-type-options|x-frame-options|referrer-policy|x-powered-by'
#   expect: CSP, nosniff, referrer-policy present; NO x-powered-by (HSTS only over HTTPS)

# 2) CORS: allowed origin is echoed, foreign origin is not
curl -si -X OPTIONS "$API/some-route" -H "Origin: $ORIGIN" -H 'Access-Control-Request-Method: POST' | grep -i 'access-control-allow-origin'
curl -si -X OPTIONS "$API/some-route" -H 'Origin: https://evil.example' -H 'Access-Control-Request-Method: POST' | grep -i 'access-control-allow-origin'
#   expect: first returns $ORIGIN; second returns nothing

# 3) Validation: unknown field rejected, oversized/invalid value rejected
curl -si -X POST "$API/some-route" -H 'Content-Type: application/json' -d '{"name":"ok","role":"admin"}'      # expect 400 (forbidNonWhitelisted)
curl -si -X POST "$API/some-route" -H 'Content-Type: application/json' -d "{\"name\":\"$(head -c 5000 /dev/zero | tr '\0' a)\"}"   # expect 400 (MaxLength)

# 4) Rate limit: burst past the limit on a throttled route
for i in $(seq 1 $((LIMIT+2))); do curl -s -o /dev/null -w '%{http_code}\n' -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{}'; done | sort | uniq -c
#   expect: 429 appears after LIMIT requests; response has Retry-After

# 5) Sanitization: stored XSS payload comes back clean
curl -s -X POST "$API/some-rich-route" -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' \
  -d '{"content":"<p>hi</p><script>alert(1)</script><a href=\"javascript:alert(1)\" onclick=\"x()\">l</a>"}'
#   then GET it back: no <script>, no onclick, no javascript: href

# 6) Swagger gated in production
curl -s -o /dev/null -w '%{http_code}\n' "$API/api/docs"     # expect 404/401/403 when NODE_ENV=production without opt-in

# 7) CSRF (only if cookie auth): unsafe request with cookie but without token
curl -si -X POST "$API/some-route" -H "Origin: $ORIGIN" --cookie "session=…" -d '{}'    # expect 403
```

## Automated checks (Jest; use `bambu-nest-test` conventions)

```ts
// sanitize-rich-text.util.spec.ts
it.each([
  ['<script>alert(1)</script><p>x</p>', '<p>x</p>'],
  ['<img src=x onerror=alert(1)>', ''],
  ['<a href="javascript:alert(1)">x</a>', '<a>x</a>'],
])('strips dangerous markup: %s', (input, expected) => {
  expect(sanitizeRichText(input)).toBe(expected);
});

// validation e2e (supertest) — app built with the SAME global pipe as main.ts
it('rejects unknown properties', () =>
  request(app.getHttpServer()).post('/things').send({ name: 'a', role: 'admin' }).expect(400));

// throttler e2e — configure a tiny limit via env/override for the test module
it('returns 429 after the limit', async () => {
  for (let i = 0; i < LIMIT; i++) await request(server).post('/auth/login').send({}).expect((r) => r.status !== 429);
  await request(server).post('/auth/login').send({}).expect(429);
});

// CORS e2e
it('does not allow foreign origins', async () => {
  const res = await request(server).options('/things').set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'POST');
  expect(res.headers['access-control-allow-origin']).toBeUndefined();
});
```

Extract the global setup into `applySecurity(app)` (see `templates/bootstrap-security.snippet.md`) and call the same function in e2e test bootstrap — otherwise tests exercise an app that production doesn't run.

## Reporting

Summarize as a table `Check | Result | Notes`. If any check fails, say so with the output; do not mark the setup done. Mention anything skipped (e.g. HSTS not testable over plain HTTP, no Redis in the test env).
