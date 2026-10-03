# Agnostic shadcn Component Catalog

## Goal

Complete the reusable, domain-agnostic UI catalog under `components/ui` using the current shadcn catalog and this project's Radix Nova configuration.

## Scope

- Keep the public API and visual behavior of existing components unless a concrete compatibility issue requires a focused change.
- Add missing general UI components and reusable compositions, including calendar/date picker, command/combobox, data table building blocks, and keyboard key display.
- Include current general-purpose shadcn components such as accordion, alerts, avatar, breadcrumb, carousel, checkbox, collapsible, menus, form fields, input groups, pagination, popovers, progress, radio group, resizable panels, sheet/drawer, skeleton, spinner, switch, table, textarea, toggle, and typography helpers.
- Exclude chart and AI/chat-specific components (Bubble, Message, Message Scroller, Marker, and Questionnaire). Use Sonner for notifications instead of the superseded Toast component. The current catalog's legacy form binding is replaced by generic native Field components.
- Keep components generic. Do not add map/editor business rules or feature API behavior under `components/ui`.
- Follow the existing warm-neutral and teal/blue semantic design tokens, accessible keyboard behavior, reduced-motion support, and the 32px minimum interactive target where applicable.
- Add only direct dependencies required by the included components.

## Implementation

1. Audit installed components, dependencies, tokens, and current shadcn-compatible APIs.
2. Add the reusable components and required dependencies without replacing unrelated local changes.
3. Document component exports, dependencies, and usage conventions.
4. Run a TypeScript check and refresh the codebase knowledge graph; report checks separately from browser/runtime coverage.

## Completion criteria

- The agreed agnostic shadcn catalog is present in `components/ui`.
- Existing components remain compatible with current callers.
- Added components use project tokens and remain free of feature-specific logic.
- Plan, progress, and feature documentation are linked.
