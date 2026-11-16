import type { Priority, TaskStatus } from "@/lib/types";

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-red-lt text-red",
  medium: "bg-orange-lt text-orange",
  low: "bg-blue-lt text-blue",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  "not-started": "bg-secondary-lt text-secondary",
  "in-progress": "bg-blue-lt text-blue",
  blocked: "bg-red-lt text-red",
  done: "bg-green-lt text-green",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[priority]}`}>
      {priority[0]?.toUpperCase()}
      {priority.slice(1)}
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}
