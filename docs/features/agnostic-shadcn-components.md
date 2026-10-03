# Agnostic shadcn UI Components

Plan: [Agnostic shadcn Component Catalog](../plans/agnostic-shadcn-components.md)  
Progress: [Agnostic shadcn Component Catalog](../progress/agnostic-shadcn-components.md)

## Purpose

`components/ui` contains generic, composable interface components. They provide presentation and interaction primitives only; feature-specific data and business rules stay in their owning feature.

## Catalog

The existing catalog remains available: Badge, Button, Card, Dialog, Input, Label, Scroll Area, Select, Separator, Slider, Tabs, and Tooltip.

The expanded catalog adds Accordion, Alert, Alert Dialog, Aspect Ratio, Attachment, Avatar, Breadcrumb, Button Group, Calendar, Carousel, Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker, Direction, Drawer, Dropdown Menu, Empty, Field, Hover Card, Input Group, Input OTP, Item, Kbd, Menubar, Native Select, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Sheet, Sidebar, Skeleton, Sonner, Spinner, Switch, Table, Textarea, Toggle, Toggle Group, and Typography.

Chart and chat-oriented components are outside this generic catalog. Sonner provides notifications in place of the older Toast API. Generic `Field` primitives support native forms without coupling the UI layer to a particular form library.

## Usage

Import from the component file that owns the primitive:

```tsx
import { Kbd } from "@/components/ui/kbd"
import { DatePicker } from "@/components/ui/date-picker"

<Kbd>⌘</Kbd>
<DatePicker value={date} onValueChange={setDate} />
```

`Combobox` takes a list of `{ value, label, keywords? }` options and reports the selected value through `onValueChange`. `DataTable` takes TanStack `ColumnDef[]` and data and provides generic sorting and pagination; applications should define their own columns, filters, selection, and server-data behavior.

```tsx
import { DataTable } from "@/components/ui/data-table"

<DataTable columns={columns} data={rows} pageSize={20} />
```

The existing Button keeps its default export and legacy `default`, `primary`, `secondary`, `ghost`, and `danger` variants. It also exports named `Button` and `buttonVariants`, supports `asChild`, adds the `outline`/`destructive`/`link` variants, and supports icon sizes for the shadcn compositions. `icon-xs` stays 32px to honor the project's minimum interactive target.

## Dependencies

| Package | Used by |
| --- | --- |
| `radix-ui` | Accessible interaction primitives already installed in the project |
| `cmdk` | Command and Combobox |
| `date-fns`, `react-day-picker` | Calendar and Date Picker |
| `embla-carousel-react` | Carousel |
| `input-otp` | Input OTP |
| `react-resizable-panels` | Resizable panels |
| `sonner` | Toast notifications |
| `vaul` | Drawer |
| `@tanstack/react-table` | Data Table, already installed |

## Design and accessibility

Components use the shared shadcn semantic tokens. The primary and focus tokens map to this app's teal action color; dark mode focus uses the muted blue selection token. Components support normal keyboard operation through their underlying primitives and retain visible focus styles. Use `TooltipProvider` around tooltip usage when the app does not already provide it.
