import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header d-print-none mb-4">
      <div className="row g-3 align-items-center">
        <div className="col">
          {eyebrow ? <div className="page-pretitle">{eyebrow}</div> : null}
          <h1 className="page-title">{title}</h1>
          <p className="text-secondary mt-1 mb-0">{description}</p>
        </div>
        {actions ? <div className="col-auto ms-auto d-flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
