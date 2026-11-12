import {
  IconAlertTriangle,
  IconCalendar,
  IconCheck,
  IconClock,
  IconListDetails,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/date";
import type { Course, GroupProject, ProjectProgress, TeamMember } from "@/lib/types";

interface ProjectCardProps {
  project: GroupProject;
  course?: Course;
  members: TeamMember[];
  progress: ProjectProgress;
  latestUpdate?: string;
  selected: boolean;
  onSelect: () => void;
}

function formatRecordedAt(value: string): string {
  return format(new Date(value), "d MMM, HH:mm");
}

export function ProjectCard({
  project,
  course,
  members,
  progress,
  latestUpdate,
  selected,
  onSelect,
}: ProjectCardProps) {
  return (
    <article className={`card h-100 ${selected ? "border-primary" : ""}`}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div className="min-w-0">
            <div className="text-uppercase text-secondary fw-semibold small mb-1">
              {course ? `${course.code} · ${course.name}` : project.courseId.toUpperCase()}
            </div>
            <h3 className="card-title text-truncate mb-1">{project.name}</h3>
            <div className="text-secondary small d-flex align-items-center gap-1">
              <IconCalendar className="icon" aria-hidden="true" />
              Official deadline {format(parseDateOnly(project.officialDeadline), "d MMM yyyy")}
            </div>
          </div>
          <span className="badge bg-blue-lt">{progress.percentage}% complete</span>
        </div>

        <div
          className="progress progress-sm mt-4"
          role="progressbar"
          aria-label={`${project.name} completion`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percentage}
        >
          <div className="progress-bar bg-primary" style={{ width: `${progress.percentage}%` }} />
        </div>

        <div className="row g-2 mt-3" aria-label="Project task summary">
          <div className="col-4">
            <div className="border rounded p-2 h-100">
              <div className="d-flex align-items-center gap-1 text-success">
                <IconCheck className="icon" aria-hidden="true" />
                <strong>{progress.completed}</strong>
              </div>
              <div className="small text-secondary">of {progress.total} done</div>
            </div>
          </div>
          <div className="col-4">
            <div className="border rounded p-2 h-100">
              <div className="d-flex align-items-center gap-1 text-danger">
                <IconAlertTriangle className="icon" aria-hidden="true" />
                <strong>{progress.blocked}</strong>
              </div>
              <div className="small text-secondary">blocked</div>
            </div>
          </div>
          <div className="col-4">
            <div className="border rounded p-2 h-100">
              <div className="d-flex align-items-center gap-1 text-orange">
                <IconClock className="icon" aria-hidden="true" />
                <strong>{progress.needsAttention}</strong>
              </div>
              <div className="small text-secondary">attention</div>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between gap-3 mt-4">
          <div className="avatar-list avatar-list-stacked" aria-label={`${members.length} team members`}>
            {members.map((member) => (
              <span
                key={member.id}
                className="avatar avatar-sm bg-blue-lt"
                title={member.displayName}
                aria-label={member.displayName}
              >
                {member.initials}
              </span>
            ))}
          </div>
          <div className="text-secondary small text-end">
            <IconClock className="icon me-1" aria-hidden="true" />
            {latestUpdate ? `Latest report ${formatRecordedAt(latestUpdate)}` : "No updates recorded"}
          </div>
        </div>

        <button
          className={`btn mt-4 ${selected ? "btn-primary" : "btn-outline-primary"}`}
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
        >
          <IconListDetails className="icon me-2" aria-hidden="true" />
          {selected ? "Viewing project" : "View project"}
        </button>
      </div>
    </article>
  );
}
