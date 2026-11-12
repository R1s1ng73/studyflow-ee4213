"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconChecklist,
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
  const { state, isHydrated, openTask } = useAcademic();
  const [now] = useState(() => new Date());

  const view = useMemo(() => {
    const currentStudentTasks = getTasksForCurrentStudent(state);
    const upcoming = currentStudentTasks
      .filter((task) => task.status !== "done" && getTaskDate(task) >= format(now, "yyyy-MM-dd"))
      .toSorted((left, right) =>
        getTaskDate(left).localeCompare(getTaskDate(right)) || left.title.localeCompare(right.title),
      )
      .slice(0, 5);

    return {
      metrics: getDashboardMetrics(state, now),
      upcoming,
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
            <div className="col-auto ms-auto">
              <button type="button" className="btn btn-primary" onClick={() => openTask()}>
                <IconPlus className="icon me-1" aria-hidden="true" />
                Add task
              </button>
            </div>
          </div>
        </div>

        <div className="alert alert-info bg-blue-lt border-0 d-flex align-items-start gap-2 mb-4" role="note">
          <span className="badge bg-blue text-blue-fg mt-1">Demo</span>
          <div>
            <strong>Local demonstration workspace.</strong>{" "}
            Counts and progress come from the saved records in this browser; group updates are not live or shared.
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
