import Link from "next/link";
import { format } from "date-fns";
import { IconAlertTriangle, IconArrowRight, IconUsersGroup } from "@tabler/icons-react";
import { parseDateOnly } from "@/lib/date";
import { getProjectProgress } from "@/lib/selectors";
import type { AcademicState } from "@/lib/types";

interface ProjectOverviewProps {
  state: AcademicState;
  now: Date;
}

export function ProjectOverview({ state, now }: ProjectOverviewProps) {
  const coursesById = new Map(state.courses.map((course) => [course.id, course]));
  const projects = state.projects
    .map((project) => ({ project, progress: getProjectProgress(state, project, now) }))
    .filter(({ progress }) => progress.total === 0 || progress.completed < progress.total)
    .toSorted((left, right) => left.project.officialDeadline.localeCompare(right.project.officialDeadline))
    .slice(0, 3);
  const projectColumnClass =
    projects.length === 1
      ? "col-12 col-md-8"
      : projects.length === 2
        ? "col-12 col-md-6"
        : "col-12 col-md-6 col-xl-4";

  return (
    <section className="card" aria-labelledby="active-projects-title">
      <div className="card-header">
        <div>
          <h2 className="card-title mb-1" id="active-projects-title">Active group projects</h2>
          <div className="text-secondary small">Progress from recorded task statuses in this browser</div>
        </div>
      </div>

      {projects.length ? (
        <div className="card-body">
          <div className="row g-4 justify-content-center">
            {projects.map(({ project, progress }) => {
              const course = coursesById.get(project.courseId);
              return (
                <div className={projectColumnClass} key={project.id}>
                  <div className="border rounded p-3 h-100 d-flex flex-column">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <span className={`avatar bg-${course?.color ?? "blue"}-lt text-${course?.color ?? "blue"}`} aria-hidden="true">
                        <IconUsersGroup className="icon" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="h4 mb-1 text-truncate">{project.name}</h3>
                        <div className="text-secondary small">
                          {course?.code ?? project.courseId.toUpperCase()} · due {format(parseDateOnly(project.officialDeadline), "d MMM")}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center gap-3 mb-2 small">
                      <span className="fw-semibold">{progress.percentage}% complete</span>
                      <span className="text-secondary">{progress.completed} of {progress.total} tasks</span>
                    </div>
                    <div
                      className="progress progress-sm mb-3"
                      role="progressbar"
                      aria-label={`${project.name} completion`}
                      aria-valuenow={progress.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="progress-bar bg-blue" style={{ width: `${progress.percentage}%` }} />
                    </div>

                    <div className="mt-auto">
                      {progress.needsAttention ? (
                        <span className="badge bg-orange-lt text-orange">
                          <IconAlertTriangle className="icon icon-sm me-1" aria-hidden="true" />
                          {progress.needsAttention} needs attention
                        </span>
                      ) : (
                        <span className="badge bg-teal-lt text-teal">No attention flags</span>
                      )}
                      {progress.blocked ? (
                        <span className="badge bg-red-lt text-red ms-2">{progress.blocked} blocked</span>
                      ) : null}
                      <div className="mt-3">
                        <Link
                          href="/projects"
                          className="link-primary fw-medium small"
                          aria-label={`Open ${project.name} in group projects`}
                        >
                          Open project <IconArrowRight className="icon icon-sm ms-1" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card-body text-center py-5">
          <IconUsersGroup className="icon icon-lg text-secondary mb-2" aria-hidden="true" />
          <h3 className="h4 mb-1">No active group projects</h3>
          <p className="text-secondary mb-0">Projects with unfinished recorded tasks will appear here.</p>
        </div>
      )}

      <div className="card-footer bg-transparent">
        <Link href="/projects" className="btn btn-link px-0">
          View group projects <IconArrowRight className="icon ms-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
