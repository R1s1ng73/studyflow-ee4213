# Testing Checklist

This file records only checks that were actually executed on 11 November 2026.

## Automated behavior covered

- Date-only parsing and formatting.
- High Impact ordering and Short Tasks filtering.
- Dashboard metrics and project progress.
- Blocked, overdue, and stale attention rules.
- Calendar event uniqueness and official project deadlines.
- Versioned storage parsing and malformed-data recovery.
- Reducer add, update, completion reversal, status timestamp, delete, and project-reference cleanup.
- Task form required fields and optional numeric/time ranges.
- Provider hydration and post-hydration persistence.

## Command results

| Check | Result |
| --- | --- |
| `npm run lint` | Passed with zero warnings or errors |
| `npm run typecheck` | Passed |
| `npm test` | 21 files, 82 tests passed |
| `npm run build` | Passed; all five application routes and the icon were statically generated |
| `npm audit --audit-level=moderate` | 0 vulnerabilities |

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

## Known limitations

- This is a local single-browser prototype; collaboration is not real-time or cross-device.
- No empirical usability participant results have been collected yet.
- Personal task/deadline tables intentionally use contained horizontal scrolling for dense metadata; group-project tasks instead use dedicated mobile cards below 768px.
