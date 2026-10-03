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
- Hardened the guest map canvas against conditional/responsive layout changes with a `ResizeObserver` and explicit post-load resize; gave the canvas a stable responsive height.
- Made the drawing state and next action explicit, kept map help text click-through so it cannot intercept drawing clicks, and allowed the map/form columns and geometry controls to wrap without horizontal overlap.
- Added unavailable, loading, duplicate-email, error-summary, review, and reference-code success states.
- Extended the project client type with the guest publication fields supplied by Tileserver.

## Verification

- `pnpm exec tsc --noEmit` passed.
- `pnpm run lint` passed.
- `pnpm exec next build --webpack` compiled successfully and completed its TypeScript phase. The default Turbopack build remains blocked in this environment by an OS-level process-port permission error while processing existing `app/globals.css`.

## Guest map usability fix (2026-10-03)

- `pnpm exec tsc --noEmit` passed after the fix.
- Browser-tested `/guest/demo` with a mocked guest project/session: the map mount and canvas both measured about 416px high; three map clicks produced `Siap: 3 titik area.` and no framework error overlay or console errors.
- The browser automation daemon exited between commands, so a separate narrow-viewport overlap measurement could not be completed. The geometry control row uses wrapping and the map/form grid uses `min-w-0` to prevent the common overflow source.
- `graphify update .` completed (917 nodes, 1239 edges).
