# Usability Iteration Log

## Baseline design

- Persistent navigation provides a stable mental model across the four integrated modules.
- Quick capture shows only required fields until Add details is expanded.
- My Tasks exposes two explicit prioritisation modes instead of an opaque score.
- Group attention rules are visible and explainable.
- Calendar editing opens the underlying task rather than creating a second record.

## Expert refinement — 11 November 2026

These changes were made through expert inspection and implementation QA before participant testing. They are not attributed to participant feedback.

### 1. Mobile group-task presentation

The original project detail used the desktop table at every breakpoint. The table contained its own horizontal scrolling, but owners, statuses, deadlines, and actions could sit outside the initial mobile viewport.

Below 768px, the same filtered task records now render as a Tabler list-group of stacked task cards. Each card exposes the task title, course, teammate, internal deadline, reported status, attention reason, latest update, blocker note, and status action. The desktop table remains unchanged at 768px and above.

Rationale: improve recognition and scanning on narrow screens without creating a second data model or hiding essential context.

### 2. Quick Wins overdue visibility

Short unfinished tasks remain eligible according to the existing duration filter and duration-first sorting. When a task's local date-only deadline has passed, Quick Wins now shows a textual **Overdue** badge in addition to its date.

Rationale: preserve the established recommendation semantics while making time-critical context visible without relying on colour.

### 3. Balanced active-project layout

Dashboard project cards now choose their desktop width from the number displayed: a centered readable column for one, equal halves for two, and thirds for three. Mobile remains single-column.

Rationale: use available desktop space deliberately without adding artificial content or stretching a single card unnecessarily.

### Supporting QA correction

During integration QA, the final missing-estimate workflow was found to remove its own return action after the last estimate was saved. The completed state now keeps a **Back to matches** control. This is a verified implementation defect found before participant testing, not a usability-test result.

### Initial and refined visual records

- Initial mobile projects: `output/playwright/projects-mobile.png`
- Refined mobile projects at 390px: `output/playwright/refinement-projects-390.png`
- Refined narrow mobile projects at 320px: `output/playwright/refinement-projects-320.png`
- Initial desktop dashboard: `output/playwright/dashboard-desktop.png`
- Refined desktop dashboard: `output/playwright/refinement-dashboard-1440.png`
- Refined missing-estimate recovery: `output/playwright/refinement-tasks-390.png`

## Future test record

Use this section only after real participants have completed the study. For each observed issue, record the task attempted, the observable problem, the design change, the reason for that change, and links to consented before/after screenshots. No participant feedback or post-test improvement is claimed in the initial prototype.

## Screenshot index

The initial implementation screenshots are generated during browser QA under `output/playwright/`. Participant-session artifacts should be stored separately according to the group's consent and data-handling plan.
