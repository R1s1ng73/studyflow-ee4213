# Tabler Academic Dashboard Design

## Product intent

Build a single-browser academic management prototype that lets a fictional student record deadlines, choose work by impact or available time, monitor reported group progress, and inspect the same records in a monthly calendar. The product supports later HCI usability testing and never claims that demo collaboration is live or that the design has already been validated.

## Visual thesis

A calm Tabler workspace with a deep navy navigation rail, a soft grey canvas, crisp white working surfaces, restrained blue actions, and dense-but-readable academic information.

## Content plan

- Dashboard: orientation, derived metrics, imminent work, short tasks, and group health.
- Deadlines: chronological records with status filters and direct edit/delete controls.
- My Tasks: one unified personal/assigned work list with High Impact and Short Tasks modes.
- Group Projects: project progress, owners, reported statuses, internal deadlines, and attention rules.
- Calendar: one monthly projection of tasks and official project deadlines from the shared store.

## Interaction thesis

- React-controlled modal, mobile navigation, toast, filters, and disclosure states avoid DOM ownership conflicts and hydration errors.
- Short fades and small transforms clarify modal, toast, and mobile-menu state changes without decorative animation.
- Progress and completion states transition immediately after saved state changes so users can see system status.

## Architecture

The Next.js App Router supplies five route entry points inside one client-side application shell. A typed `AcademicProvider` owns a reducer-backed `AcademicState`, hydrates it from a versioned localStorage envelope, and exposes mutation actions. Initial server and client renders use the same unhydrated state; demo data is created only in a client effect to prevent hydration mismatch.

All personal and group work uses one `Task` entity. A group task is distinguished by `projectId`, `assignedTo`, and `internalDueDate`; projects reference task IDs and never store progress totals. Dashboard metrics, project progress, priority lists, attention flags, and calendar events are selectors derived from state.

Tabler CSS is imported once globally from `@tabler/core`. Interactive behavior is owned by React, so no Bootstrap or Tabler JavaScript bundle is loaded. This follows Tabler's Next.js guidance while avoiding duplicate JavaScript and browser-global access during SSR.

## Core boundaries

- `lib/types.ts`: domain types and storage schema.
- `lib/demo-data.ts`: date-relative fictional seed data with four courses, twelve-plus tasks, three projects, and five people.
- `lib/selectors.ts`: pure calculations for counts, ordering, attention, progress, and calendar projection.
- `lib/storage.ts`: versioned serialization, safe validation, and malformed-data recovery.
- `context/academic-context.tsx`: hydration and mutations only; no page-specific rendering.
- `components/layout/*`: responsive shell, navigation, header actions, and demo-data disclosure.
- `components/tasks/*`: reusable form, task detail, status/priority badges, and table rows.
- `components/calendar/*`: date-only month grid and event interactions.
- Route feature components: page-specific composition and local UI filters.

## Data and dates

Dates use `yyyy-MM-dd` strings and are parsed as local calendar dates. Optional times use `HH:mm` strings. ISO timestamps are reserved for created/updated/status-update metadata. Calendar projection uses task IDs as stable event IDs and creates one task event per underlying task plus one separate official-deadline event per project.

The localStorage key is versioned. Unknown or malformed data falls back to fresh demo data and shows the user a recovery notice. Reset Demo Data is explicit and confirmation-gated.

## UX and accessibility

Every input has a visible label and field-specific error. Optional task fields start collapsed. Modals use `role="dialog"`, an accessible name, focus placement, Escape handling, and focus restoration. Statuses always include text, not color alone. Tables collapse into readable mobile rows, controls remain touch-sized, and focus rings remain visible.

Save, delete, completion, status, and reset actions produce a concise confirmation toast. Destructive deletion and reset require confirmation. Users can cancel edits without mutation and can reopen completed tasks.

## Error handling

- Required fields and invalid numeric ranges block task save with inline errors.
- Storage parse/schema failure recovers to demo state instead of crashing.
- Missing related course, project, or member records render safe fallback labels.
- Empty and no-match states state exactly what the system knows and offer a relevant action.

## Testing strategy

Pure selectors, validation, and storage parsing are developed test-first with Vitest. Component tests cover the modal validation/save flow and state mutation behavior. Browser checks exercise all four acceptance workflows at desktop and mobile widths, verify page navigation and dialogs, and inspect the console. Final verification includes lint, typecheck, unit tests, and a production build.

## Scope decisions

No authentication, backend, external calendar integration, drag-and-drop, recurring events, charts, or fake synchronization are included. Project status changes are explicitly described as recorded reports in the current browser. CSS customization stays narrow and layers on official Tabler classes rather than introducing another design system.
