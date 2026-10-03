# Progress: Agnostic shadcn Component Catalog

Plan: [Agnostic shadcn Component Catalog](../plans/agnostic-shadcn-components.md)

## Status

- [x] Confirm catalog scope and design/dependency decisions with the user.
- [x] Inspect current UI catalog, shadcn config, dependencies, and design tokens.
- [x] Add the agreed reusable components and required dependencies.
- [x] Add usage documentation and link the plan/progress records.
- [x] Run the scoped TypeScript check and refresh the codebase knowledge graph.

## Notes

- `PRODUCT.md` is referenced by the repository guide but is absent in this checkout. `DESIGN.md` is present and already has user-local changes; preserve it.
- The repository has unrelated user changes in the working tree. Keep this task limited to its plan, progress, feature documentation, `components/ui`, and directly required dependency/config files.
- Expanded the UI catalog with Radix-backed shadcn components and generic Date Picker, Data Table, and Combobox compositions. Kept legacy files intact except the Button API extension required by the new compositions.
- Removed the generated Base UI dependency and implemented Combobox with the existing Radix Popover + Command stack.
- Mapped the shared primary/focus semantic tokens to the app's teal action color and the dark focus token to the muted-blue selection color.
- Extended the existing Button compatibly with named exports, `asChild`, additional variants, and icon sizes required by the catalog.
- `pnpm exec tsc --noEmit` passed. `graphify update .` rebuilt the graph with 847 nodes and 1123 edges.
- No test suite is configured for this repository; browser and interaction checks were not run.
