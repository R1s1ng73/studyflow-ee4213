# Architecture

## Overview

StudyFlow is a Next.js App Router application with one React-managed client data store. The five routes are presentation boundaries; they do not own separate copies of task data.

```text
App Router pages
  └─ AppShell + AcademicProvider
       ├─ Dashboard selectors
       ├─ Task/deadline views
       ├─ Group-project views
       └─ Calendar event projection
              ↓
       Versioned localStorage envelope
```

## Shared model

`AcademicState` contains courses, team members, tasks, and group projects. Personal and group work both use `Task`; a group task has `projectId`, `assignedTo`, and `internalDueDate`. Projects reference task IDs and never store redundant completion totals.

Derived selectors calculate:

- dashboard counts;
- High Impact and Short Tasks ordering;
- overdue and attention status;
- project completion percentages;
- calendar events.

This prevents a task from diverging across Dashboard, My Tasks, Deadlines, Group Projects, and Calendar.

## State and persistence

`AcademicProvider` wraps a pure reducer. It starts with an empty deterministic shape on both server and client, then hydrates inside a client effect. Valid stored data is reused; missing data receives date-relative demo records; malformed data safely recovers and displays a notice.

Mutations are persisted under `studyflow:academic-state:v1`. Reset is explicit and confirmation-gated. Storage is intentionally browser-local for the prototype.

## Dates

Calendar dates use `yyyy-MM-dd` strings and manual local-date parsing. Optional times use `HH:mm`. Only audit timestamps use ISO instants. Calendar selectors choose `internalDueDate` for group tasks and create a separate event for each project's official deadline.

## UI organization

Tabler CSS is imported globally once. The sidebar, cards, tables, forms, badges, progress bars, alerts, segmented controls, and modal styling use Tabler classes. React controls every interactive state, so no Tabler or Bootstrap JavaScript bundle is loaded and no browser-dependent initialization occurs during SSR.

Focused feature and component folders own route-specific presentation, while shared context, selectors, task modal, shell, and UI feedback are reused.
