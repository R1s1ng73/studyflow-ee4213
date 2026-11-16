import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon?: ReactNode;
  tone?: "blue" | "orange" | "teal" | "purple";
}

export function StatCard({
  title,
  value,
  description,
  icon,
  tone = "blue",
}: StatCardProps) {
  return (
    <div className="card h-100" aria-label={`${title}: ${value}`}>
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <div className="text-secondary text-uppercase fw-semibold small mb-2">{title}</div>
            <div className="h1 mb-1">{value}</div>
          </div>
          {icon ? (
            <span className={`avatar avatar-md bg-${tone}-lt text-${tone}`} aria-hidden="true">
              {icon}
            </span>
          ) : null}
        </div>
        <p className="text-secondary small mb-0">{description}</p>
      </div>
    </div>
  );
}
