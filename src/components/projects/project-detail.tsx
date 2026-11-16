import {
  IconAlertTriangle,
  IconCalendar,
  IconChevronDown,
  IconClock,
  IconEdit,
  IconFilter,
} from "@tabler/icons-react";
import { format } from "date-fns";
import type { Ref } from "react";
import { parseDateOnly } from "@/lib/date";
import { getDemoProjectDetails } from "@/lib/demo-project-details";
import { isTaskAttentionNeeded, isTaskOverdue } from "@/lib/selectors";
import type { Course, GroupProject, Task, TeamMember } from "@/lib/types";
import { filterProjectTasks, getTaskRecordedAt, type ProjectTaskFilter } from "./project-utils";

interface ProjectDetailProps {
  headingRef?: Ref<HTMLHeadingElement>;
  project: GroupProject;
  course?: Course;
  members: TeamMember[];
  tasks: Task[];
  filter: ProjectTaskFilter;
  onFilterChange: (filter: ProjectTaskFilter) => void;
  onUpdateStatus: (task: Task) => void;
  now: Date;
}

const STATUS_STYLES = {
  "not-started": { label: "Not started", className: "bg-secondary-lt" },
  "in-progress": { label: "In progress", className: "bg-blue-lt" },
  blocked: { label: "Blocked", className: "bg-red-lt" },
  done: { label: "Done", className: "bg-green-lt" },
} as const;

function formatRecordedAt(value: string): string {
  return format(new Date(value), "d MMM yyyy, HH:mm");
}

export function ProjectDetail({
  headingRef,
  project,
  course,
  members,
  tasks,
  filter,
  onFilterChange,
  onUpdateStatus,
  now,
}: ProjectDetailProps) {
  const details = getDemoProjectDetails(project.id);
  const visibleTasks = filterProjectTasks(tasks, filter, now);
  const membersById = new Map(members.map((member) => [member.id, member]));
  const presentedTasks = visibleTasks.map((task) => {
    const needsAttention = isTaskAttentionNeeded(task, now);
    const overdue = isTaskOverdue(task, now);
    return {
      task,
      status: STATUS_STYLES[task.status],
      owner: task.assignedTo ? membersById.get(task.assignedTo) : undefined,
      needsAttention,
      recordedAt: getTaskRecordedAt(task),
      attentionReason:
        task.status === "blocked"
          ? "Blocked task"
          : overdue
            ? "Internal deadline passed"
            : needsAttention
              ? "No status update in over 48 hours"
              : undefined,
    };
  });

  return (
    <section className="card" id="project-details" aria-labelledby="project-detail-title">
      <div className="card-body border-bottom">
        <div>
          <div className="text-uppercase text-secondary fw-semibold small">
            {course?.code ?? project.courseId.toUpperCase()}
          </div>
          <h2 className="card-title fs-2 mt-1 study-project-heading" id="project-detail-title" tabIndex={-1} ref={headingRef}>
            {project.name}
          </h2>
          <div className="study-project-deadline mt-3">
            <IconCalendar className="icon mt-1" aria-hidden="true" />
            <div>
              <div className="fw-semibold">Official project submission deadline</div>
              <time dateTime={project.officialDeadline}>
                {project.officialDeadline ? format(parseDateOnly(project.officialDeadline), "d MMMM yyyy") : "No due date"}
              </time>
            </div>
          </div>
        </div>
        {project.canvasUrl ? <a className="d-inline-block mt-3" href={project.canvasUrl} target="_blank" rel="noreferrer">View assignment in Canvas</a> : null}
        {details ? (
          <div className="mt-4">
            <h3 className="h4 mb-1">Project brief</h3>
            <p className="mb-2">{details.summary}</p>
            <p className="mb-0"><strong>Deliverables</strong> · {details.deliverables}</p>
          </div>
        ) : null}
      </div>

      <div className="card-body border-bottom">
        <h3 className="h4 mb-3">Team members ({members.length})</h3>
        {members.length === 0 && project.canvasUrl ? <p className="text-secondary mb-0">Canvas did not provide a team roster.</p> : null}
        <div className="study-project-members">
          {members.map((member) => (
            <details className="study-project-member border rounded" key={member.id}>
              <summary className="d-flex align-items-center gap-2 p-2">
                <span className="avatar avatar-sm bg-blue-lt flex-shrink-0" aria-hidden="true">{member.initials}</span>
                <span className="flex-grow-1">
                  <span className="d-block fw-semibold">{member.displayName}</span>
                  {member.id === details?.leaderId ? <span className="badge bg-blue-lt">Group leader</span> : null}
                </span>
                <IconChevronDown className="icon flex-shrink-0" aria-hidden="true" />
              </summary>
              <div className="border-top p-2 small">
                <p className="mb-1 fw-semibold">
                  {member.id === details?.leaderId ? "Project coordination" : "Project member"}
                </p>
                <p className="mb-0">{details?.responsibilities[member.id] ?? "No project responsibilities recorded."}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="card-body border-bottom py-3">
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div>
            <h3 className="h4 mb-1">{project.canvasUrl ? "Group submission" : `Project subtasks (${tasks.length})`}</h3>
            <p className="text-secondary small mb-0">
              {project.canvasUrl
                ? "This is the submission status available to your Canvas account."
                : "The assigned teammate is the person to follow up with. Each subtask has its own team due date."}
            </p>
          </div>
          <div className="btn-group flex-shrink-0" role="group" aria-label="Filter group tasks">
            <button
              type="button"
              className={`btn ${filter === "all" ? "btn-primary" : "btn-outline-primary"}`}
              aria-pressed={filter === "all"}
              onClick={() => onFilterChange("all")}
            >
              All <span className="badge bg-white text-primary ms-1">{tasks.length}</span>
            </button>
            <button
              type="button"
              className={`btn ${filter === "attention" ? "btn-primary" : "btn-outline-primary"}`}
              aria-pressed={filter === "attention"}
              onClick={() => onFilterChange("attention")}
            >
              <IconFilter className="icon me-1" aria-hidden="true" />
              Needs attention
              <span className="badge bg-white text-primary ms-1">
                {filterProjectTasks(tasks, "attention", now).length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="empty py-5">
          <div className="empty-icon">
            <IconAlertTriangle className="icon" aria-hidden="true" />
          </div>
          <p className="empty-title">{filter === "attention" ? "No tasks need attention" : "No project subtasks recorded"}</p>
          {filter === "attention" ? (
            <>
              <p className="empty-subtitle text-secondary">
                Nothing is blocked, overdue, or missing a recent status report.
              </p>
              <div className="empty-action">
                <button className="btn btn-outline-primary" type="button" onClick={() => onFilterChange("all")}>
                  Show all tasks
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <>
          <div
            className="list-group list-group-flush d-md-none"
            role="list"
            aria-label={`Mobile tasks for ${project.name}`}
          >
            {presentedTasks.map(({ task, status, owner, needsAttention, recordedAt, attentionReason }) => (
              <article
                className="list-group-item p-3"
                key={task.id}
                role="listitem"
                aria-labelledby={`mobile-project-task-${task.id}`}
              >
                <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-secondary small text-uppercase fw-semibold mb-1">
                      {course?.code ?? project.courseId.toUpperCase()}
                    </div>
                    <h4 className="h3 mb-0" id={`mobile-project-task-${task.id}`}>
                      {task.title}
                    </h4>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                    <span className={`badge ${status.className}`}>{status.label}</span>
                    {needsAttention ? <span className="badge bg-orange-lt">Needs attention</span> : null}
                  </div>
                </div>

                <dl className="row g-3 mb-3 small">
                  <div className="col-12 col-sm-4">
                    <dt className="text-secondary fw-normal mb-1">Assigned teammate</dt>
                    <dd className="d-flex align-items-center gap-2 mb-0 fw-medium">
                      <span className="avatar avatar-xs bg-blue-lt">{owner?.initials ?? "—"}</span>
                      {owner?.displayName ?? "Unassigned"}
                    </dd>
                  </div>
                  <div className="col-6 col-sm-4">
                    <dt className="text-secondary fw-normal mb-1">Subtask due date</dt>
                    <dd className="mb-0 fw-medium">
                      <IconCalendar className="icon icon-sm me-1" aria-hidden="true" />
                      {task.internalDueDate
                        ? format(parseDateOnly(task.internalDueDate), "d MMM yyyy")
                        : "Not set"}
                    </dd>
                  </div>
                  <div className="col-6 col-sm-4">
                    <dt className="text-secondary fw-normal mb-1">Status last updated</dt>
                    <dd className="mb-0 text-secondary">
                      <IconClock className="icon icon-sm me-1" aria-hidden="true" />
                      {formatRecordedAt(recordedAt)}
                    </dd>
                  </div>
                </dl>

                {attentionReason ? (
                  <div className="small text-orange mb-2">
                    <IconAlertTriangle className="icon icon-sm me-1" aria-hidden="true" />
                    {attentionReason}
                  </div>
                ) : null}
                {task.blockerReason ? (
                  <div className="alert alert-danger py-2 px-3 mb-3" role="note">
                    <span className="fw-semibold">Blocker:</span> {task.blockerReason}
                  </div>
                ) : null}

                {!task.canvasUrl ? <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={() => onUpdateStatus(task)}
                  aria-label={`Update reported status for ${task.title}`}
                >
                  <IconEdit className="icon me-1" aria-hidden="true" />
                  Update reported status
                </button> : null}
              </article>
            ))}
          </div>

          <div className="table-responsive d-none d-md-block">
            <table className="table table-vcenter card-table">
            <caption className="visually-hidden">Tasks for {project.name}</caption>
            <thead>
              <tr>
                <th scope="col">Subtask</th>
                <th scope="col">Assigned teammate</th>
                <th scope="col">Subtask due date</th>
                <th scope="col">Reported status</th>
                <th scope="col">Status last updated</th>
                <th scope="col" className="w-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {presentedTasks.map(({ task, status, owner, needsAttention, recordedAt }) => (
                  <tr key={task.id}>
                    <td>
                      <div className="fw-semibold">{task.title}</div>
                      {task.blockerReason ? (
                        <div className="small text-danger mt-1">
                          <IconAlertTriangle className="icon me-1" aria-hidden="true" />
                          {task.blockerReason}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="avatar avatar-xs bg-blue-lt">{owner?.initials ?? "—"}</span>
                        <span>{owner?.displayName ?? "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="text-nowrap">
                      {task.internalDueDate
                        ? format(parseDateOnly(task.internalDueDate), "d MMM yyyy")
                        : "Not set"}
                    </td>
                    <td>
                      <div className="d-flex flex-column align-items-start gap-1">
                        <span className={`badge ${status.className}`}>{status.label}</span>
                        {needsAttention ? <span className="badge bg-orange-lt">Needs attention</span> : null}
                      </div>
                    </td>
                    <td className="text-nowrap text-secondary small">
                      <IconClock className="icon me-1" aria-hidden="true" />
                      {formatRecordedAt(recordedAt)}
                    </td>
                    <td>
                      {task.canvasUrl ? (
                        <a href={task.canvasUrl} target="_blank" rel="noreferrer">Canvas</a>
                      ) : <button
                        type="button"
                        className="btn btn-sm btn-outline-primary text-nowrap"
                        onClick={() => onUpdateStatus(task)}
                        aria-label={`Update reported status for ${task.title}`}
                      >
                        <IconEdit className="icon me-1" aria-hidden="true" />
                        Update
                      </button>}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </section>
  );
}
