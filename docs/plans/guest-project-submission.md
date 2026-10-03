# Guest project submission

## Goal

Add a public, project-specific guest page that allows one verified-or-temporarily-unverified submission per normalized email and project. The guest draws the project's single geometry, completes the existing form schema, reviews, and submits once. Tileserver owns the session, duplicate guard, consent, and persistence rules.

## Confirmed decisions

- Guest URL is `/guest/{public_slug}`; `public_slug` is stable and unique.
- A project must be `guest_enabled` and within optional active dates.
- Identity fields: full name, email, phone/WhatsApp, organization, and required consent.
- OTP remains a visible step. `GUEST_OTP_REQUIRED=false` is allowed only for the initial non-production phase; OTP uses SMTP when enabled.
- Duplicate scope is `(project_id, normalized_email)` where normalized email is trimmed and lowercased.
- Tileserver issues a 30-minute, project-bound `guest_session_token`; submit also requires an idempotency key.
- Guest drafts are not resumable after refresh or tab close.
- Submit creates `guest_submission` metadata and the project Feature transactionally.
- Guest identity data is never returned by public GeoJSON or public feature endpoints.
- Rate limiting, OTP cooldown/attempt limits, and CAPTCHA/Turnstile protect public endpoints.
- Guest reuses the Project `geometry_type` and `form_schema`; file fields block guest enablement for now.

## Proposed API boundary

- `GET /api/v1/guest/projects/{public_slug}` — public project context and form schema.
- `POST /api/v1/guest/projects/{public_slug}/sessions` — create a short-lived session.
- `POST /api/v1/guest/sessions/{session_token}/otp/request` — request OTP.
- `POST /api/v1/guest/sessions/{session_token}/otp/verify` — verify OTP.
- `POST /api/v1/guest/sessions/{session_token}/submissions` — create Feature + guest submission atomically.
- `GET /api/v1/guest/sessions/{session_token}/status` — show already-submitted status without exposing PII.

## Delivery

1. Add Tileserver SQLModel schema, migration, settings, public project fields, session/OTP/submission use cases, and protected public routers.
2. Add guest page, stepper, identity/consent form, map drawing, review/confirmation, success/duplicate states, and API client in `map-editor-web`.
3. Keep the existing authenticated Map Editor and admin CRUD behavior unchanged.
4. Verify migration, API tests, type-check, lint, and guest flow smoke tests.

## Out of scope

- Guest edit/delete, draft resume, file uploads, project administration UI, or production email provider selection.
