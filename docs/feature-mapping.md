# Feature Mapping

## Subgroup 1 — Deadline Capture

The global Add Task action opens the same validated capture form from Dashboard, Deadlines, My Tasks, and Calendar. Saved records appear immediately in every relevant view. Deadlines provides upcoming, overdue, and completed filters plus edit/delete access.

## Subgroup 2 — Group Progress

Group Projects derives completion, blocked counts, and attention states from shared task records. Details show owners, internal deadlines, reported status, blocker notes, and update timestamps. Status updates change the shared task rather than a project-only copy.

## Subgroup 3 — Task Prioritisation

My Tasks combines personal work with group tasks assigned to the demo student. High Impact respects manual priority before deadline. Short Tasks uses user-entered estimates and excludes missing estimates from duration matches without inventing values.

## Subgroup 4 — Unified Calendar

Calendar projects tasks and official project deadlines into a month grid. Opening a task event edits the underlying shared task. A changed deadline therefore moves the event without duplicate entry.

## Integration

The four contributions meet at the `Task` record and pure selectors. Completion, priority, estimate, deadline, and group-status mutations propagate through the shared reducer and update Dashboard metrics, list views, project progress, and Calendar projection together.
