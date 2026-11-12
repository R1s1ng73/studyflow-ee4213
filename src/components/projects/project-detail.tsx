import {
  IconAlertTriangle,
  IconCalendar,
  IconClock,
  IconEdit,
  IconFilter,
  IconUsers,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/date";
import { isTaskAttentionNeeded, isTaskOverdue } from "@/lib/selectors";
import type { Course, GroupProject, Task, TeamMember } from "@/lib/types";
import { filterProjectTasks, getTaskRecordedAt, type ProjectTaskFilter } from "./project-utils";

interface ProjectDetailProps {
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
  project,
  course,
  members,
  tasks,
  filter,
  onFilterChange,
  onUpdateStatus,
  now,
}: ProjectDetailProps) {
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
    <section className="card" aria-labelledby="project-detail-title">
      <div className="card-header align-items-start">
        <div>
          <div className="text-uppercase text-secondary fw-semibold small">
            {course?.code ?? project.courseId.toUpperCase()}
          </div>
          <h2 className="card-title fs-2 mt-1" id="project-detail-title">
            {project.name}
          </h2>
          <div className="text-secondary mt-1 d-flex flex-wrap gap-3">
            <span>
              <IconCalendar className="icon me-1" aria-hidden="true" />
              Official deadline {format(parseDateOnly(project.officialDeadline), "d MMMM yyyy")}
            </span>
            <span>
              <IconUsers className="icon me-1" aria-hidden="true" />
              {members.length} team members
            </span>
          </div>
        </div>
      </div>

      <div className="card-body border-bottom">
        <h3 className="h4 mb-3">Team members</h3>
        <div className="d-flex flex-wrap gap-3">
          {members.map((member) => (
            <div className="d-flex align-items-center gap-2" key={member.id}>
              <span className="avatar avatar-sm bg-blue-lt">{member.initials}</span>
              <span className="fw-medium">{member.displayName}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-body border-bottom py-3">
        <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
          <div>
            <h3 className="h4 mb-1">Reported task status</h3>
            <p className="text-secondary small mb-0">
              Demo updates are stored only in this browser. A task needs attention when it is blocked,
              overdue, or has no status report for more than 48 hours.
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
          <p className="empty-title">No tasks need attention</p>
          <p className="empty-subtitle text-secondary">
            Nothing is blocked, overdue, or missing a recent status report.
          </p>
          <div className="empty-action">
            <button className="btn btn-outline-primary" type="button" onClick={() => onFilterChange("all")}>
              Show all tasks
            </button>
          </div>
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
                    <dt className="text-secondary fw-normal mb-1">Internal deadline</dt>
                    <dd className="mb-0 fw-medium">
                      <IconCalendar className="icon icon-sm me-1" aria-hidden="true" />
                      {task.internalDueDate
                        ? format(parseDateOnly(task.internalDueDate), "d MMM yyyy")
                        : "Not set"}
                    </dd>
                  </div>
                  <div className="col-6 col-sm-4">
                    <dt className="text-secondary fw-normal mb-1">Last updated</dt>
                    <dd className="mb-0 fw-medium">
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

                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  onClick={() => onUpdateStatus(task)}
                  aria-label={`Update reported status for ${task.title}`}
                >
                  <IconEdit className="icon me-1" aria-hidden="true" />
                  Update reported status
                </button>
              </article>
            ))}
          </div>

          <div className="table-responsive d-none d-md-block">
            <table className="table table-vcenter card-table">
            <caption className="visually-hidden">Tasks for {project.name}</caption>
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Owner</th>
                <th scope="col">Internal deadline</th>
                <th scope="col">Reported status</th>
                <th scope="col">Last update</th>
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
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary text-nowrap"
                        onClick={() => onUpdateStatus(task)}
                        aria-label={`Update reported status for ${task.title}`}
                      >
                        <IconEdit className="icon me-1" aria-hidden="true" />
                        Update
                      </button>
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
