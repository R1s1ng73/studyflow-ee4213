"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, startOfWeek } from "date-fns";
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconChecklist,
  IconFileUpload,
  IconPlus,
  IconUsersGroup,
} from "@tabler/icons-react";
import { ProjectOverview } from "@/components/dashboard/project-overview";
import { QuickTasks } from "@/components/dashboard/quick-tasks";
import { StatCard } from "@/components/dashboard/stat-card";
import { UpcomingList } from "@/components/dashboard/upcoming-list";
import { useAcademic } from "@/context/academic-context";
import {
  getDashboardMetrics,
  getShortTasks,
  getTaskDate,
  getTasksForCurrentStudent,
} from "@/lib/selectors";

export function DashboardPage() {
  const { state, isHydrated, openTask, canvasSync } = useAcademic();
  const [now] = useState(() => new Date());

  const view = useMemo(() => {
    const currentStudentTasks = getTasksForCurrentStudent(state);
    const upcoming = currentStudentTasks
      .filter((task) => task.status !== "done" && getTaskDate(task) >= format(now, "yyyy-MM-dd"))
      .toSorted((left, right) =>
        getTaskDate(left).localeCompare(getTaskDate(right)) || left.title.localeCompare(right.title),
      )
      .slice(0, 5);
    const firstWeek = startOfWeek(now, { weekStartsOn: 1 });
    const weeks = Array.from({ length: 4 }, (_, index) => {
      const start = addDays(firstWeek, index * 7);
      const end = addDays(start, 6);
      const from = format(start, "yyyy-MM-dd");
      const through = format(end, "yyyy-MM-dd");
      const total = currentStudentTasks.filter((task) => task.dateMeaning === "submission-deadline" &&
        getTaskDate(task) >= from && getTaskDate(task) <= through).length;
      return { from, label: `${format(start, "d MMM")} – ${format(end, "d MMM")}`, total };
    });

    return {
      metrics: getDashboardMetrics(state, now),
      upcoming,
      weeks,
      shortTasks: getShortTasks(currentStudentTasks, 30).slice(0, 4),
    };
  }, [now, state]);

  if (!isHydrated) {
    return (
      <div className="page-body" aria-label="Loading dashboard">
        <div className="container-xl">
          <div className="placeholder-glow py-5">
            <span className="placeholder col-4 mb-3" />
            <span className="placeholder col-8" />
          </div>
        </div>
      </div>
    );
  }

  const currentMember = state.members.find((member) => member.id === state.currentMemberId);
  const firstName = currentMember?.displayName.split(/\s+/)[0] ?? "there";

  return (
    <div className="page-body">
      <div className="container-xl">
        <div className="page-header d-print-none mb-4">
          <div className="row align-items-center g-3 w-100">
            <div className="col">
              <div className="page-pretitle">{format(now, "EEEE, d MMMM yyyy")}</div>
              <h1 className="page-title">Good {greetingFor(now)}, {firstName}</h1>
              <p className="text-secondary mt-2 mb-0">
                Here is what needs your attention across your recorded academic work.
              </p>
            </div>
            <div className="col-auto ms-auto d-flex flex-wrap gap-2">
              <Link className="btn btn-outline-primary" href="/import">
                <IconFileUpload className="icon" aria-hidden="true" /> Import tasks
              </Link>
              <button type="button" className="btn btn-primary" onClick={() => openTask()}>
                <IconPlus className="icon me-1" aria-hidden="true" />
                Add task
              </button>
            </div>
          </div>
        </div>

        <div className="alert alert-info bg-blue-lt border-0 d-flex align-items-start gap-2 mb-4" role="note">
          <span className="badge bg-blue text-blue-fg mt-1">Canvas</span>
          <div>
            <strong>{canvasSync.busy ? "Syncing courses and assignments…" : "CityU Canvas workspace"}</strong>
            <div className="small">
              {canvasSync.syncedAt
                ? `Last synced ${format(new Date(canvasSync.syncedAt), "d MMM, HH:mm")}. `
                : ""}
              Canvas deadlines are shown in Hong Kong time. Your planning edits are saved in this browser.
            </div>
          </div>
        </div>

        <div className="row row-cards mb-4">
          <div className="col-sm-6 col-xl-3">
            <StatCard
              title="Upcoming deadlines"
              value={view.metrics.upcomingDeadlines}
              description="Due in the next 14 days"
              tone="blue"
              icon={<IconCalendarDue className="icon" />}
            />
          </div>
          <div className="col-sm-6 col-xl-3">
            <StatCard
              title="Urgent or overdue"
              value={view.metrics.urgentOrOverdue}
              description="Personal work due within 3 days"
              tone="orange"
              icon={<IconAlertTriangle className="icon" />}
            />
          </div>
          <div className="col-sm-6 col-xl-3">
            <StatCard
              title="Unfinished tasks"
              value={view.metrics.unfinishedPersonal}
              description="Open personal work items"
              tone="teal"
              icon={<IconChecklist className="icon" />}
            />
          </div>
          <div className="col-sm-6 col-xl-3">
            <StatCard
              title="Group attention"
              value={view.metrics.groupNeedsAttention}
              description="Blocked, overdue, or stale reports"
              tone="purple"
              icon={<IconUsersGroup className="icon" />}
            />
          </div>
        </div>

        <div className="row row-cards mb-4">
          <div className="col-12 col-lg-7">
            <UpcomingList
              tasks={view.upcoming}
              courses={state.courses}
              now={now}
              onOpenTask={openTask}
            />
          </div>
          <div className="col-12 col-lg-5">
            <QuickTasks tasks={view.shortTasks} courses={state.courses} now={now} onOpenTask={openTask} />
          </div>
        </div>

        {state.tasks.length ? (
          <section className="card mb-4" aria-labelledby="weekly-deadlines">
            <div className="card-body">
              <h2 id="weekly-deadlines" className="card-title">Deadlines by week</h2>
              <ul className="list-unstyled row g-3 mb-0">
                {view.weeks.map((week) => (
                  <li key={week.from} className="col-6 col-md-3">
                    <div className="border rounded p-3 h-100">
                      <div className="text-secondary">{week.label}</div>
                      <div><strong className="fs-2">{week.total}</strong> {week.total === 1 ? "deadline" : "deadlines"}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
        <ProjectOverview state={state} now={now} />
      </div>
    </div>
  );
}

function greetingFor(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
