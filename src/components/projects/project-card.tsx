import {
  IconAlertTriangle,
  IconCalendar,
  IconCheck,
  IconClock,
  IconListDetails,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { parseDateOnly } from "@/lib/date";
import { getDemoProjectDetails } from "@/lib/demo-project-details";
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
  const leaderId = getDemoProjectDetails(project.id)?.leaderId;

  return (
    <article className={`card h-100 ${selected ? "border-primary" : ""}`}>
      <div className="card-body d-flex flex-column">
        <div>
          <div className="text-uppercase text-secondary fw-semibold small mb-1">
            {course ? `${course.code} · ${course.name}` : project.courseId.toUpperCase()}
          </div>
          <h3 className="card-title mb-1">{project.name}</h3>
          <div className="text-secondary small d-flex align-items-center gap-1">
            <IconCalendar className="icon flex-shrink-0" aria-hidden="true" />
            {project.officialDeadline
              ? `Official deadline ${format(parseDateOnly(project.officialDeadline), "d MMM yyyy")}`
              : "No official deadline"}
          </div>
          <span className="badge bg-blue-lt mt-2">{progress.percentage}% complete</span>
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

        <div className="d-flex flex-column gap-2 mt-4 mb-4">
          <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0" aria-label={`${members.length} team members`}>
            {members.map((member) => (
              <li
                key={member.id}
                className="avatar avatar-sm bg-blue-lt"
                title={member.id === leaderId ? `${member.displayName} (Group leader)` : member.displayName}
              >
                <span aria-hidden="true">{member.initials}</span>
                <span className="visually-hidden">{member.displayName}</span>
              </li>
            ))}
          </ul>
          <div className="text-secondary small">
            <IconClock className="icon me-1" aria-hidden="true" />
            {latestUpdate ? `Latest report ${formatRecordedAt(latestUpdate)}` : "No updates recorded"}
          </div>
        </div>

        <button
          className={`btn mt-auto ${selected ? "btn-primary" : "btn-outline-primary"}`}
          type="button"
          onClick={onSelect}
          aria-controls="project-details"
          aria-label={`View project details for ${project.name}`}
        >
          <IconListDetails className="icon me-2" aria-hidden="true" />
          View project details
        </button>
      </div>
    </article>
  );
}
