# Workspace dock, navigation, and login surface

**Plan:** [workspace-dock-navigation-login.md](../plans/workspace-dock-navigation-login.md)  
**Progress:** [workspace-dock-navigation-login.md](../progress/workspace-dock-navigation-login.md)

## Dock editor

The bottom-center dock is the single map-control entry point. It starts compact with:

- **Peralatan editor** to expand or collapse geometry editing controls.
- **Tabel data tersimpan** to show or hide the Feature table.

When opened, the editor controls wrap on smaller screens instead of extending off the canvas. The table opens above the dock and closes from the same table control, keeping the map unobstructed when data is not needed.

## Navbar and login form

The top navigation bar contains the active Project selector, current geometry/count status on larger screens, and **Masuk**. Its modal form has email and password fields with browser autofill support.

Map Editor currently has no configured authentication endpoint or session contract. Submitting the form clearly reports that condition and does not create a mock authenticated session. Connect the form only after the authentication API contract and secure session lifecycle are available.
