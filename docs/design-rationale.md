# Design Rationale

## Tabler application shell

A fixed desktop sidebar preserves orientation across five destinations; mobile uses a compact header and React-controlled drawer. The light grey canvas, white work surfaces, navy navigation, and restrained blue accent follow Tabler's dashboard language while keeping academic information readable.

## HCI decisions

- **Visibility of system status:** saved changes produce a toast; status text and update timestamps remain visible.
- **Consistency and standards:** one page-header pattern, task dialog, badge vocabulary, and date formatting system are reused.
- **User control and freedom:** users can cancel edits, correct deadlines, delete with confirmation, mark work done, and reopen it.
- **Error prevention:** the capture form validates required fields and numeric ranges before mutation.
- **Recognition over recall:** courses, dates, duration, priority, owner, and status appear directly in working lists.
- **Minimalism:** optional task details begin collapsed and decorative charts are omitted.

## Specific choices

Optional fields are collapsed because course, title, assessment type, and date are sufficient for quick capture. The disclosure keeps richer metadata available without making every save feel like a long form.

Estimates remain user-entered and editable because the prototype has no evidence-based estimation model. Missing estimates are visible and excluded from Short Tasks results rather than silently guessed.

Group statuses are described as recorded reports because local demo updates do not prove live teammate activity. The 48-hour rule highlights stale information, not poor performance.

Calendar reuses task records because duplicate entry creates inconsistency and increases memory burden. Date meaning and event type remain textual so colour is not the only cue.

The interface is prepared for usability testing but is not described as empirically validated.
