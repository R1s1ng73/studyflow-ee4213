# Tabler Academic Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a responsive, accessible Tabler-based academic management prototype whose five views share one persistent task model.

**Architecture:** Next.js App Router pages render within a React client shell backed by a reducer/context store. Versioned localStorage persistence and pure selectors keep every view synchronized; Tabler supplies global CSS and React owns all interactions.

**Tech Stack:** Next.js, TypeScript, React, `@tabler/core`, `@tabler/icons-react`, date-fns, Vitest, Testing Library, localStorage

---

### Task 1: Project foundation and test harness

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `app/layout.tsx`, `app/globals.css`

- [ ] Define scripts for `dev`, `build`, `lint`, `typecheck`, and `test` and install only the requested runtime packages plus test/lint development tooling.
- [ ] Import `@tabler/core/dist/css/tabler.min.css` exactly once and add a small responsive customization layer.
- [ ] Run `npm run typecheck` and `npm run build`; both must exit 0.

### Task 2: Domain model, demo data, and selectors (TDD)

**Files:** `src/lib/types.ts`, `src/lib/demo-data.ts`, `src/lib/date.ts`, `src/lib/selectors.ts`, `src/lib/selectors.test.ts`

- [ ] Write failing tests for high-impact ordering, short-task filtering, dashboard counts, project progress, 48-hour attention rules, calendar de-duplication, and date-only parsing.
- [ ] Run `npm test -- src/lib/selectors.test.ts` and confirm failures are caused by missing implementations.
- [ ] Implement strict domain types, date-relative demo data, and pure selectors.
- [ ] Re-run the focused tests and confirm all pass.

### Task 3: Versioned persistence and reducer store (TDD)

**Files:** `src/lib/storage.ts`, `src/lib/storage.test.ts`, `src/context/academic-context.tsx`, `src/context/academic-reducer.test.ts`

- [ ] Write failing tests for valid hydration, malformed-data fallback, add/update/delete, completion reversal, group status timestamps, and reset.
- [ ] Implement safe parsing and a reducer whose mutations update `updatedAt` and, for status changes, `statusUpdatedAt`.
- [ ] Hydrate after mount, persist subsequent mutations, and expose task-modal/toast actions without browser access during SSR.
- [ ] Run the focused tests and the full unit suite.

### Task 4: Responsive Tabler shell

**Files:** `src/components/layout/app-shell.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/mobile-nav.tsx`, `src/components/layout/page-header.tsx`, `src/components/ui/toast.tsx`, route pages

- [ ] Build the fixed desktop sidebar, mobile header/drawer, active-route states, demo-data disclosure, reset confirmation, and global Add Task action with semantic controls.
- [ ] Add lightweight route shells for Dashboard, My Tasks, Calendar, Group Projects, and Deadlines.
- [ ] Verify keyboard navigation, 320px layout, and no horizontal overflow in the browser.

### Task 5: Task capture and deadlines workflow (TDD)

**Files:** `src/lib/validation.ts`, `src/lib/validation.test.ts`, `src/components/tasks/task-modal.tsx`, `src/components/tasks/task-table.tsx`, `src/features/deadlines/deadlines-page.tsx`

- [ ] Write failing validation tests for required fields, invalid date/time, priority, duration, and grade-weight bounds.
- [ ] Implement the accessible React-controlled create/edit modal with collapsed optional fields, inline errors, delete confirmation, and save confirmation.
- [ ] Implement Upcoming, Overdue, and Completed deadline filters sorted chronologically.
- [ ] Browser-test add, edit, cancel, delete, persistence, and recovery/empty states.

### Task 6: Prioritisation workflow

**Files:** `src/features/tasks/my-tasks-page.tsx`, `src/components/tasks/task-list.tsx`, `src/components/tasks/task-badges.tsx`

- [ ] Build High Impact and Short Tasks segmented controls using tested selectors.
- [ ] Add 15/30/60/120-minute filters, a missing-estimates path, inline priority/duration edits, Done/Reopen, and group association labels.
- [ ] Browser-test the 30-minute scenario and cross-view completion updates.

### Task 7: Group project workflow

**Files:** `src/features/projects/projects-page.tsx`, `src/components/projects/project-card.tsx`, `src/components/projects/project-detail.tsx`, `src/components/projects/group-task-dialog.tsx`

- [ ] Render project progress, stacked avatars, blocked/attention counts, and latest recorded update from selectors.
- [ ] Add All/Needs Attention filtering, owner/internal-deadline/last-update columns, and a status dialog with optional blocker reason.
- [ ] Browser-test status persistence, timestamp refresh, progress recalculation, and explanatory reported-data copy.

### Task 8: Unified calendar workflow

**Files:** `src/features/calendar/calendar-page.tsx`, `src/components/calendar/month-calendar.tsx`, `src/components/calendar/day-dialog.tsx`

- [ ] Render a Monday-first six-week month grid with previous/next/today navigation and a visible current-day marker.
- [ ] Derive labeled task and official-project events from shared state, open day/event details, and edit the underlying task.
- [ ] Browser-test correct local dates, month navigation, completion appearance, moved deadlines, and no duplicate task events.

### Task 9: Dashboard integration

**Files:** `src/features/dashboard/dashboard-page.tsx`, `src/components/dashboard/stat-card.tsx`, `src/components/dashboard/upcoming-list.tsx`, `src/components/dashboard/project-overview.tsx`

- [ ] Render greeting/date, four derived metrics, upcoming deadlines, short tasks, and active project progress.
- [ ] Ensure every row has a useful navigation/detail action and every count changes after the corresponding mutation.
- [ ] Browser-test the unified overview workflow.

### Task 10: Documentation and final verification

**Files:** `README.md`, `docs/architecture.md`, `docs/feature-mapping.md`, `docs/design-rationale.md`, `docs/testing-checklist.md`, `docs/usability-iteration.md`, `docs/ai-collaboration.md`

- [ ] Document actual architecture, setup/deployment, feature mapping, HCI rationale, known limitations, and only tests that were truly executed.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` from a clean command invocation.
- [ ] Execute all four browser workflows at desktop and mobile widths, inspect console output, and save final screenshots under `output/playwright/`.
- [ ] Review every Definition of Done item and record any remaining risk honestly.
