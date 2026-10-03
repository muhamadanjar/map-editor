# Progress: Guest project submission

**Plan:** [guest-project-submission.md](../plans/guest-project-submission.md)

## Discovery

- Confirmed the Tileserver implementation target: `/home/anjar/Development/base-project-apps/services/tileserver_api`.
- Confirmed the backend follows Clean Architecture, SQLModel-first migrations, and separate docs/plans and docs/progress records.

## Implementation

- Added `features/guest` with a Tileserver-backed API client, public project view, MapLibre/OSM geometry drawer, and a progressive submission form.
- Added the thin route `app/guest/[slug]/page.tsx` for stable public URLs.
- The form collects consented identity data, retains a single idempotency key for retries, visibly preserves the OTP step, and explains when OTP is temporarily skipped.
- The guest map only draws the project geometry type; it does not expose existing feature data or guest edit/delete controls.
- Added unavailable, loading, duplicate-email, error-summary, review, and reference-code success states.
- Extended the project client type with the guest publication fields supplied by Tileserver.

## Verification

- `pnpm exec tsc --noEmit` passed.
- `pnpm run lint` passed.
- `pnpm exec next build --webpack` compiled successfully and completed its TypeScript phase. The default Turbopack build remains blocked in this environment by an OS-level process-port permission error while processing existing `app/globals.css`.
