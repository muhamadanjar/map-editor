# GPS Location Control Plan

## Goal

Add a one-shot browser geolocation control to the project map navigation stack.

## User behavior

- Place the GPS button immediately after zoom out and before the compass.
- On activation, request a fresh, high-accuracy browser position with a 10-second timeout and no cached position.
- While the request is pending, show a loading state and disable repeated activation.
- On success, show a location point with the reported accuracy radius and move the map to the point at zoom 16.
- Keep the point and accuracy radius visible when the map is moved; replace them on the next successful request.
- On denial, unavailable position, timeout, or unsupported geolocation, show a short Indonesian toast and leave the map and prior marker unchanged.
- Do not continuously track location.

## Design constraints

Follow `DESIGN.md`: compact floating white map controls, teal for spatial actions, semantic accessible controls, and reduced-motion support through existing map motion conventions.

## Scope

Implement this on the project map and its existing navigation control component. Mount the existing Sonner toaster in the root layout so location errors can use the agreed toast pattern. Render location and accuracy above existing map layers. No location persistence, background tracking, or changes to other map views.

## Acceptance criteria

- The control appears in the agreed position and exposes an accessible Indonesian label and loading state.
- Successful requests update the visible location marker and accuracy radius and move to zoom 16.
- Failed requests preserve the existing map/marker and provide an Indonesian toast.
- The request is one-shot and cannot be duplicated while pending.
