# Testing Checklist

This file records only checks that were actually executed. The initial pass was 11 November 2026 (21 files, 82 tests); the newest version was re-checked on 17 November 2026 against commit `7dd6bcb`.

## Automated behavior covered

- Date-only parsing and formatting.
- High Impact ordering and Short Tasks filtering, including hiding tasks without a due date by default.
- Dashboard metrics and project progress.
- Blocked, overdue, and stale attention rules.
- Calendar event uniqueness and official project deadlines.
- Versioned storage parsing, malformed-data recovery, and the optional `createdBy` field.
- Reducer add, update, completion reversal, status timestamp, delete, project-reference cleanup, and bulk estimate fills that never overwrite saved values.
- Task form required fields, optional numeric/time ranges, and the 23:59 submission-deadline default.
- Provider hydration, post-hydration persistence, and the local fallback when the AI estimate endpoint fails.
- Group-project official/internal split and internal-subtask behaviour across Canvas sync.
- Completed-deadline ordering (newest first).
- Task-import candidate normalization, including document-based `estimatedMinutes`.
- AI estimate route: title-only payload, minutes normalization (5–1440, nearest five), and error handling.

## Command results — 17 November 2026

| Check | Result |
| --- | --- |
| `npm run lint` | Passed with zero warnings or errors |
| `npm run typecheck` | Passed |
| `npm test` | 28 files, 118 tests passed |
| `npm run build` | Passed; the six application pages, the icon, and the three API routes (`/api/canvas/sync`, `/api/tasks/extract`, `/api/tasks/estimate`) built successfully |
| `npm audit --audit-level=moderate` | 0 vulnerabilities |

The 11 November baseline recorded 21 files and 82 tests.

## Browser workflows executed

### Deadline Capture and Calendar

- Opened Add task from Dashboard.
- Confirmed specific required-field errors for an empty form.
- Expanded optional details and saved a task with priority and duration.
- Confirmed the task appeared on the correct Calendar date.
- Edited its deadline from the calendar event and confirmed it moved to the new date.
- Opened a group-task event, confirmed the form showed its internal deadline, changed it, and confirmed the calendar event moved while the base project date remained intact.
- Cleared time, duration, grade weight, and topics from an existing task; reopened it and confirmed the fields remained cleared.

Result: passed. The same shared task record updated across views and localStorage.

### Task Prioritisation

- Opened My Tasks and selected Short Tasks with the 30-minute filter.
- Confirmed tasks without estimates were excluded and surfaced separately.
- Marked a matching task Done.
- Confirmed the completed count changed and Dashboard/Calendar reflected the shared state.

Result: passed.

### Group Project Progress

- Opened Group Projects and selected Needs attention.
- Inspected the blocked task's owner, internal deadline, blocker reason, and last report.
- Changed the reported status to Done.
- Confirmed project progress changed from 33% to 67%, blocked/attention counts recalculated, and the save confirmation appeared.

Result: passed.

### Unified Academic Overview

- Reviewed Dashboard-derived metrics and upcoming work.
- Opened the Database Systems exam from Calendar.
- Confirmed its date meaning was Scheduled start.
- Returned to the unified task list.

Result: passed.

## Responsive and accessibility observations

- Tested the fixed desktop sidebar at 1440×1000 and the mobile header/drawer at 390×844.
- Verified Dashboard, My Tasks, Deadlines, Calendar, and Group Projects all report document width equal to viewport width at 390px.
- Dense task tables scroll inside their card rather than expanding the page.
- Verified dialog labels, focus placement, Escape close/focus restoration tests, textual statuses, calendar completion labels, and visible field errors.
- Verified the mobile drawer focuses its close control, traps Tab, makes the page inert/hidden, locks body scrolling, and restores the opener/background on Escape.
- Injected a schema-shaped stored record with an invalid date; reload recovered to demo data with an honest warning rather than crashing.
- The optimized local application produced no browser console errors after the app icon was added.
- Desktop visual verdict: 94/100 against the official Tabler preview.
- Mobile visual verdict: 93/100 against the official Tabler preview.

## Final refinement QA — 11 November 2026

These are expert QA results collected before participant usability testing.

- Verified all five routes at 1440px, 768px, 390px, and 320px. For every route/viewport pair, document scroll width equalled viewport width.
- Verified Group Projects uses the task table at 768px and above, and three stacked mobile task cards below 768px.
- At 390px and 320px, each task card exposed teammate, internal deadline, status text, last update, attention reason, blocker note, and a full-width update action.
- Updated the blocked group task from a mobile card; project progress changed from 33% to 67%, Needs attention changed to zero, and the result persisted after refresh.
- Verified Quick Wins displayed the unfinished 9 November task with a textual **Overdue** badge while preserving the duration-based task order.
- Verified two active Dashboard projects occupied equal desktop columns.
- Verified the two active Dashboard projects also occupied equal columns at 768px, with no page overflow.
- Verified required-field errors, task creation, deadline editing, refresh persistence, and deletion in the Deadlines workflow.
- Verified the 30-minute Short Tasks mode, estimate editing, final missing-estimate recovery, Done, and Reopen.
- Verified Calendar next-month and Today navigation, event editing, and the same changed deadline in Deadlines.
- Browser console after the full navigation and workflow pass: zero errors and zero warnings.
- Refinement visual verdict: 97/100. Missing-estimate recovery follow-up: 95/100.

## Newest version check — 17 November 2026

Executed in the local application against the live Canvas workspace and the local DeepSeek key at the default desktop viewport. Temporary test records were removed and the original localStorage snapshot was restored after each run.

### Group Projects — official vs internal work

- Opened a real Canvas group assignment and confirmed the read-only **Official from Canvas** block.
- Added an internal subtask with an internal deadline, owner, and notes; confirmed the **Internal** badge and **Added by \<name\>** attribution.
- Reloaded and ran a Canvas sync; confirmed the internal subtask and its deadline survived and the project kept the reference.
- Edited the internal deadline, then deleted the subtask after confirmation.
- Confirmed the delete removed the task and left no dangling project task reference.

### Deadlines

- Opened Completed and confirmed the order ran from the closest date to now backwards (12 Nov 2026 → 5 Nov → 2 Nov … → 27 May 2026).

### My Tasks

- Confirmed 15 unfinished tasks without a due date were hidden from High Impact by default, and that the **Show tasks without a due date (15)** switch revealed them.
- Ran **Estimate missing times (15)**: the control showed **Estimating…**, finished in about one second, and filled all 15 blanks with values from the AI endpoint (for example 20–25 minute safety quizzes and a 60 minute in-class test).
- Confirmed the toast reported the AI path (`AI filled in 15 estimates from task titles`); automated tests cover that saved estimates are never overwritten.
- Called `/api/tasks/estimate` directly with three titles and received `[180, 30, 45]`, confirming only titles are sent.

### Import

- Read the Harbour Code Hackathon poster through the real DeepSeek pipeline.
- Confirmed each item carried a document-based estimate (for example 30, 120, 600 in one review) with the **Estimated from the document** hint, editable before import.
- Cleared a deadline item's time and switched its date meaning to Deadline; the field filled with 23:59, and an estimate that was not a multiple of five passed native validation.

### Task capture

- Opened Add task, chose Submission deadline, and confirmed the time field defaulted to 23:59.

Result: passed. The workspace was restored to its original state afterwards (74 tasks, 4 existing estimates, 15 undated tasks).

The responsive viewport checks recorded on 11 November were not repeated for this version; the new sections reuse the existing table and mobile-card patterns already covered there and by automated tests.

## Known limitations

- This is a local single-browser prototype; collaboration is not real-time or cross-device.
- No empirical usability participant results have been collected yet.
- Personal task/deadline tables intentionally use contained horizontal scrolling for dense metadata; group-project tasks instead use dedicated mobile cards below 768px.
