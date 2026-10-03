# Workspace dock, navigation, and login surface

## Goal

Keep the Project workspace map-first by replacing persistent vertical and table surfaces with a compact bottom dock, and add an account entry point with an accessible login modal.

## Scope

- Make the editor toolbar a bottom dock that starts collapsed and expands its map-editing controls on demand.
- Put the saved-Feature table toggle in that dock. Render the table only while requested, above the dock, so its panel does not permanently consume canvas space.
- Replace the workspace header with a compact top navigation bar containing the project switcher, status, and a login trigger.
- Add visible email and password labels, password-manager-friendly autocomplete, submit feedback, keyboard Escape support, and focus-managed dialog behavior.
- Authentication is presentation-only in this change: this application has no discovered login API or session contract, so submit must not pretend to establish a session.

## Interaction design

- The dock uses the existing warm-neutral, teal, muted-blue selection, and 44px target conventions. It opens and closes with an explicit labelled control and a 150-250ms transform/opacity transition.
- Opening the table does not shift map layout. The table appears as an independent docked drawer above the control rail and can be closed from the same rail.
- The account control remains in the top-right navbar. Login modal errors are adjacent to the form action and the disabled integration state is explicit.

## Verification

1. Run TypeScript, focused ESLint, and diff checks.
2. Run `graphify update .`.
3. Perform a browser smoke test at desktop and narrow viewport when a browser runtime is available.
