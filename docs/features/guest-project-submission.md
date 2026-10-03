# Guest project submission

**Plan:** [guest-project-submission.md](../plans/guest-project-submission.md)  
**Progress:** [guest-project-submission.md](../progress/guest-project-submission.md)

## Purpose

The public guest page lets a visitor submit one project feature without using the authenticated Map Editor. It is designed for a focused, form-like flow while keeping the normal editor workspace unchanged.

## Visitor flow

1. Open `/guest/{public_slug}`.
2. Enter name, email, phone/WhatsApp, organization, and consent.
3. Complete the visible OTP stage when Tileserver requires it. In the initial environment, the stage clearly indicates that verification is skipped.
4. Draw exactly the geometry type configured by the project on an OpenStreetMap base map and fill the project questions.
5. Review the information and submit once.
6. Keep the returned `GUEST-…` reference code.

The page handles unavailable projects, validation errors, duplicate email submissions, and recoverable load errors without exposing existing project features or identity records.

The map canvas resizes with its container and has a fixed responsive working height. To draw, activate the geometry button first, then click the map; the current drawing state and minimum point requirements are shown below the map. Navigation controls stay in the map corner, while drawing controls wrap below the map on narrow screens.

## Integration

All calls use the existing same-origin Tileserver proxy at `/api/tileserver/api/v1/guest/...`. The browser never needs a Tileserver base URL or authentication token. The backend owns guest sessions, consent, OTP, duplicate checks, and creation of the final Feature.

## Project requirements

Tileserver must configure a project with a unique `public_slug`, `guest_enabled=true`, a `geometry_type`, and a compatible `form_schema`. File fields are not supported in the public flow and must not be used for a guest-enabled project.
