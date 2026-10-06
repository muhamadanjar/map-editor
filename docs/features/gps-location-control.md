# GPS Location Control

**Plan:** [GPS Location Control Plan](../plans/gps-location-control.md)  
**Progress:** [GPS Location Control Progress](../progress/gps-location-control.md)

## How it works

The project map navigation stack includes a GPS control between zoom out and the compass. Selecting it asks the browser for a fresh, high-accuracy location. The request does not track the device continuously and times out after 10 seconds.

While the browser is resolving the request, the control shows a spinner and is disabled. On success, the map moves to the reported position at zoom 16. A teal point and a geodesic accuracy area remain visible as the map moves. Selecting GPS again requests a new position and replaces the marker and area.

If the browser denies access, cannot determine a position, or times out, a short Indonesian toast explains the issue. The map and any previous GPS marker remain unchanged. If geolocation is unavailable in the browser or connection context, a toast explains that location is unavailable.

## How to use

1. Select the GPS button below zoom out.
2. Allow location access in the browser when prompted.
3. Select the GPS button again whenever you want to refresh the displayed location.
