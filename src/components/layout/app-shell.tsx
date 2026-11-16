"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type ComponentType } from "react";
import {
  IconCalendarMonth,
  IconChecklist,
  IconClockExclamation,
  IconFileUpload,
  IconLayoutDashboard,
  IconMenu2,
  IconPlus,
  IconRefresh,
  IconSchool,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";
import { useAcademic } from "@/context/academic-context";
import { TaskModal } from "@/components/tasks/task-modal";
import { LoadingState } from "@/components/ui/loading-state";
import { Toast } from "@/components/ui/toast";
import { useModalFocus } from "@/hooks/use-modal-focus";

interface NavigationItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const navigation: NavigationItem[] = [
  { href: "/", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/tasks", label: "My Tasks", icon: IconChecklist },
  { href: "/calendar", label: "Calendar", icon: IconCalendarMonth },
  { href: "/projects", label: "Group Projects", icon: IconUsersGroup },
  { href: "/deadlines", label: "Deadlines", icon: IconClockExclamation },
  { href: "/import", label: "Import tasks", icon: IconFileUpload },
];

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="navbar-nav" aria-label="Primary navigation">
      {navigation.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <div className="nav-item" key={item.href}>
            <Link
              className={`nav-link${active ? " active" : ""}`}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              <span className="nav-link-icon d-md-none d-lg-inline-block" aria-hidden="true">
                <Icon className="icon" />
              </span>
              <span className="nav-link-title">{item.label}</span>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, isHydrated, recoveryNotice, openTask, canvasSync, syncCanvas } = useAcademic();
  const currentMember = state.members.find((member) => member.id === state.currentMemberId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileDrawerRef = useRef<HTMLElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  useModalFocus({
    active: mobileOpen,
    containerRef: mobileDrawerRef,
    initialFocusRef: mobileCloseRef,
    onEscape: () => setMobileOpen(false),
  });

  return (
    <div className="page study-app">
      <aside className="navbar navbar-vertical navbar-expand-lg study-sidebar" aria-label="Application sidebar">
        <div className="container-fluid flex-column align-items-stretch h-100">
          <div className="navbar-brand navbar-brand-autodark d-flex align-items-center justify-content-start gap-2 p-0 mb-4">
            <span className="avatar bg-blue text-white" aria-hidden="true"><IconSchool className="icon" /></span>
            <span><span className="d-block text-white fw-bold">StudyFlow</span><span className="d-block small text-white-50 fw-normal">Academic workspace</span></span>
          </div>
          <Navigation pathname={pathname} />
          <div className="mt-auto pt-4">
            <button type="button" className="btn btn-ghost-light w-100 justify-content-start" disabled={canvasSync.busy} onClick={syncCanvas}>
              <IconRefresh className="icon me-2" aria-hidden="true" /> {canvasSync.busy ? "Syncing Canvas…" : "Sync Canvas"}
            </button>
            {currentMember ? (
              <div className="d-flex align-items-center gap-2 mt-3 pt-3 border-top border-white border-opacity-10">
                <span className="avatar avatar-sm bg-blue-lt text-blue">{currentMember.initials}</span>
                <div className="text-white small fw-semibold">{currentMember.displayName}</div>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <header className="study-mobile-header d-lg-none">
        <button className="btn btn-icon btn-ghost-secondary" type="button" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
          <IconMenu2 className="icon" />
        </button>
        <Link className="d-flex align-items-center gap-2 text-reset text-decoration-none fw-bold" href="/">
          <IconSchool className="icon text-blue" aria-hidden="true" /> StudyFlow
        </Link>
        <button className="btn btn-icon btn-primary" type="button" aria-label="Add task" onClick={() => openTask()}>
          <IconPlus className="icon" />
        </button>
      </header>

      {mobileOpen ? (
        <div className="study-mobile-overlay d-lg-none" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileOpen(false); }}>
          <aside ref={mobileDrawerRef} className="study-mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <span className="fw-bold d-flex align-items-center gap-2"><IconSchool className="icon text-blue" /> StudyFlow</span>
              <button ref={mobileCloseRef} className="btn btn-icon btn-ghost-secondary" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><IconX className="icon" /></button>
            </div>
            <Navigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <button type="button" className="btn btn-outline-secondary w-100 mt-4" disabled={canvasSync.busy} onClick={() => { void syncCanvas(); setMobileOpen(false); }}>
              <IconRefresh className="icon me-2" aria-hidden="true" /> Sync Canvas
            </button>
          </aside>
        </div>
      ) : null}

      <div className="page-wrapper study-page-wrapper">
        {recoveryNotice ? <div className="container-xl pt-3"><div className="alert alert-warning mb-0" role="alert">{recoveryNotice}</div></div> : null}
        {canvasSync.message ? (
          <div className="container-xl pt-3"><div className="alert alert-warning mb-0" role="status">{canvasSync.message}</div></div>
        ) : null}
        {isHydrated ? children : <LoadingState />}
      </div>
      <TaskModal />
      <Toast />
    </div>
  );
}
