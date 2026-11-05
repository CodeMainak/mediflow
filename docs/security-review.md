# Security and reliability review

Review of the whole backend, plus the new prescription feature. The authorization, validation, rate-limit and data-exposure fixes have automated tests against a real MongoDB (`src/app.security.test.ts`, `prescriptionAssistant.integration.test.ts`, `app.ratelimit.test.ts`). The frontend headers were checked once in real Chrome; that script isn't in the repo. The `docker-compose.yml` change and the page-size cap aren't tested.

## Fixed

| Severity | Problem | Fix |
| --- | --- | --- |
| Critical | Signup trusted `role` from the request, so anyone could register as Admin | Self-signup is always Patient |
| Critical | Hard-coded fallback JWT secret in `socketService.ts` let anyone forge socket tokens if the variable was unset | Removed. The server won't start without `JWT_SECRET`. `docker-compose.yml` no longer has a default |
| High | A receptionist could create Admins or promote anyone, and `updateUser` wrote any field from the request | Field allowlist. Only Admin changes roles or edits staff |
| High | Any doctor could delete any medical record | Scoped to the record's own doctor |
| High | Any patient or doctor could read any appointment by id | Scoped to people on the appointment |
| High | Any doctor could change the status of any appointment | Scoped to that doctor's appointments |
| High | NoSQL injection: `{ "email": { "$ne": null } }` reached the login query | Types are checked before querying |
| High | The double-booking unique index used `$nin`, which MongoDB rejects, so it never existed and simultaneous bookings could both succeed | Rebuilt with `$in`. A race test proves it |
| Medium | A booking conflict returned the other patient's whole appointment | Returns a message only |
| Medium | 52 controller responses could send error details to clients | One middleware strips them from every 5xx and logs the route and error name only |
| Medium | Doctor list and search exposed doctors' phone, address and other fields | Public fields only |
| Medium | CORS accepted any origin with credentials | Allowlist, credentials off (auth is a header token) |
| Medium | `/uploads` was served publicly | Removed. Nothing wrote there |
| Medium | User search ran raw input as a regex (ReDoS), with no page-size cap | Escaped, capped at 100 |
| Medium | Deleting an account left that patient's health data behind | Deletion now includes symptom checks, saved places and prescription data |
| Low | The login limiter counted every `/api/auth` request, including `/me`, so normal use could cause lockouts | Applies to login and signup, and counts failures only |
| Low | `DELETE /notifications/clear-all` was unreachable, because `/:id` matched first | Route order fixed |
| Low | No security headers on the frontend | CSP and related headers in `vercel.json`, tested in Chrome with no violations |

## JWT and XSS

**Decision: keep the bearer token in `localStorage` for now.** Any XSS could steal it. An httpOnly cookie is the stronger design, but Vercel and Render are different sites, so it would need `SameSite=None` and CSRF protection, or a shared domain. That's the right next step for real patient data. Current mitigations:

- A CSP with `script-src 'self'`, so injected inline scripts don't run
- React escapes all rendered text, including extracted prescription text
- Tokens expire in 1 day, and verification is pinned to HS256
- The role is read from the database on each request, not trusted from the token

## Limits

| Limit | Default | Environment variable |
| --- | --- | --- |
| Failed logins | 5 per 15 min per IP | |
| All API calls | 100 per 15 min per IP | |
| Uploads | 20 per hour per IP | |
| Waiting files | 5 per patient | |
| New accounts | 10 per hour per IP | |
| Upload attempts | 10 per patient per day, including rejected and deleted ones | `UPLOAD_USER_DAILY_LIMIT` |
| Non-prescriptions | After 3 in a day, that account's uploads pause until the next day | `UPLOAD_USER_DAILY_REJECTED_LIMIT` |
| Triage AI calls | 40 per patient, 300 for the demo, 2000 in total, per day | `AI_TRIAGE_USER_DAILY_LIMIT`, `AI_TRIAGE_DEMO_DAILY_LIMIT`, `AI_TRIAGE_DAILY_LIMIT` |
| Extraction AI calls | 5 per patient, 100 in total, per day | `AI_EXTRACTION_USER_DAILY_LIMIT`, `AI_EXTRACTION_DAILY_LIMIT` |
| Tokens per day, all AI combined | 500,000, the closest thing here to a spending limit | `AI_DAILY_TOKEN_LIMIT` |
| Output tokens per call | 400 for triage, 1500 for extraction | |
| Triage transcript | 7 messages of up to 500 characters, and at least 3 letters to start | |
| PDF length | 3 pages (rough check: pages in compressed streams aren't visible, so some long PDFs get through) | |
| Minimum file size | 1 KB | |

Calls that never reach OpenAI: a repeat upload of the same file by the same patient, a second read of a document already read, and anything rejected above. Readings are never reused between patients. There are no automatic retries.

The token budget is checked before each call and counts tokens after each reply, so calls already running can go slightly over. Calls that fail or time out report no tokens, so only their call count limits them.

AI quotas are atomic, so concurrent requests can't overspend. They **fail closed**: if the count can't be checked, no paid call is made and the non-AI path answers. These defaults are starting guesses; set them from your OpenAI budget. A separate hard spending limit in the OpenAI dashboard is still recommended.

## Logging and metrics

Logs carry event, outcome, HTTP status, latency and counts. They never carry patient text, user ids, document ids or error messages, because error messages can quote data. Tests enforce this. Admins can see daily totals by outcome and token count at `GET /api/admin/ai-usage?days=7`; it has no per-user rows.

## Prompt injection

| Attack | Defence |
| --- | --- |
| Text in a symptom or a document says "ignore your rules" | The prompts treat it as data, which helps but isn't enough on its own |
| Trying to force a dangerous urgency | Strict schema and validation limit output to fixed values. Emergency detection never uses the model |
| Text in a document tries to steer the specialist | Specialties come from rules, and only after the patient confirms |
| Instructions in a document naming a medicine | In live testing `gpt-4o-mini` listed one and `gpt-4o` ignored it, so this isn't guaranteed. Overlong names are dropped, the patient reviews everything, React shows it as plain text, and a listed name can only affect a suggestion after the patient confirms it |
| Faked assistant turns in the triage transcript | **Open.** The client still owns the transcript. Limited impact: emergency checks read only patient messages and output is still constrained |

## Retention and deletion

| Data | Kept for | Patient can delete |
| --- | --- | --- |
| Original prescription file | Until confirmed, 24 hours at most. Deleted immediately if the model says it isn't a prescription | Yes |
| Confirmed prescription details | 30 days | Yes |
| Symptom check history | **No automatic expiry yet: your decision.** 12 months is a common starting point. It wasn't added because it would permanently delete existing data on deploy | Yes, new "Delete all my past checks" button |
| Per-user AI quota counters | 2 days | Automatic |
| Aggregate AI metrics | 35 days | Contains no personal data |
| All of a patient's health data above | Removed with their account | Via admin |

Database backups aren't covered by these periods and would need their own policy.

## Production failures tested

| Scenario | Result |
| --- | --- |
| OpenAI down, slow, rate-limiting, returning garbage or refusing | Triage uses the rules engine; prescriptions offer manual entry |
| Budget exceeded, or budget database unreachable | No paid call is made; the same non-AI paths answer |
| Database failure in a query | Generic 500, with no internals |
| Emergency symptoms with everything else down | Still returns emergency |
| Double click or simultaneous requests | One extraction charge, one booking |
| File expired before reading | Manual entry, with an explanation |
| Oversized, wrong-type or disguised file | 413 or 415, nothing stored |
| Offline or slow network in the browser | Clear message, Cancel and Try again (tested in Chrome) |

## Open risks

- **Public demo accounts include an Admin, with a password listed in the README and on the login page.** Anyone can use it on the live demo, including deleting users. Consider making the demo Admin read-only, or removing it from the public list.
- **The old fallback secret and a seeded password are in git history, and `scripts/seed.js` contains what looks like a real person's email.** If that password is used anywhere, change it. Replace the email with an example address.
- **Google Places demo calls have only an IP limit,** with no overall daily cap like the AI calls have.
- **Any doctor can view any patient's prescriptions.** That may be fine for one small clinic, but it's a policy decision.
- **Socket events aren't validated:** any signed-in user can send typing or message events to any user id. They aren't saved, but the messaging rules should be applied here too.
- **Rate limits are per process and in memory,** so they reset on restart and need a shared store before running more than one instance. The same applies to socket presence and reminder dedupe.
- **No malware scanning** of uploaded files.
- **Many accounts can still use up the shared daily limits.** Signups are limited per IP, but rotating IPs gets around that, and accounts need no email verification. Spending stays capped, and the feature falls back to manual entry, but real patients would lose automatic reading until the next day. Email verification or a CAPTCHA at signup is the next step, and a per-network limit at the hosting or CDN layer would add to it.
- **Request-size checks rely on `Content-Length`.** A request without one is still cut off at 5 MB by the upload parser, after that much has been received.

## Deploying these changes

1. Set `ALLOWED_ORIGINS` on Render if you use any frontend origin besides `mediflow-frontend-sigma.vercel.app`, such as a custom domain or preview URLs. Otherwise those sites' API calls will fail with CORS errors.
2. If the backend isn't at `mediflow-backend-0gpb.onrender.com`, update `connect-src` in `mediflow-frontend/vercel.json`.
3. Check for existing duplicate bookings. If any exist, the new unique index won't build until they're resolved.
4. Passwords now need at least 8 characters for new accounts. Existing logins aren't affected.
