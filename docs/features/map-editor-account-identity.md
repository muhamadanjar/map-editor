# Account identity in Map Editor

**Plan:** [Map Editor authentication](../plans/map-editor-authentication.md)  
**Progress:** [Implementation progress](../progress/map-editor-authentication.md)

After the protected editor session is validated against UserManagement `/auth/info`, Map Editor exposes the signed-in user's name and email in the workspace navbar next to the sign-out control. The same-origin session endpoint returns only those two profile fields to the browser; access and refresh tokens remain in server-managed HttpOnly cookies.

If UserManagement does not provide a name or email, the navbar shows the available field and omits the missing value.
