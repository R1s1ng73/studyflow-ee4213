"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, startOfMonth } from "date-fns";
import { IconCalendarMonth, IconPlus } from "@tabler/icons-react";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { useAcademic } from "@/context/academic-context";
import { buildCalendarEvents } from "@/lib/selectors";

interface CalendarClock {
  month: Date;
  today: Date;
}

export function CalendarPage() {
  const { state, isHydrated, openTask } = useAcademic();
  const [clock, setClock] = useState<CalendarClock | null>(null);
  const events = useMemo(() => buildCalendarEvents(state), [state]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const today = new Date();
      setClock({ month: startOfMonth(today), today });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function showToday() {
    const today = new Date();
    setClock({ month: startOfMonth(today), today });
  }

  return (
    <div className="page-body">
      <div className="container-xl">
        <div className="page-header d-print-none mb-4">
          <div className="row align-items-center g-3">
            <div className="col">
              <div className="page-pretitle d-flex align-items-center gap-2">
                <IconCalendarMonth aria-hidden="true" size={18} />
                Academic planning
              </div>
              <h1 className="page-title">Unified Calendar</h1>
              <p className="text-secondary mt-2 mb-0">
                Tasks, group work and official project deadlines from one shared schedule.
              </p>
            </div>
            <div className="col-auto ms-auto">
              <button className="btn btn-primary" onClick={() => openTask()} type="button">
                <IconPlus aria-hidden="true" size={18} />
                Add Task
              </button>
            </div>
          </div>
        </div>

        {!isHydrated || !clock ? (
          <div aria-busy="true" aria-label="Loading calendar" className="card shadow-sm">
            <div className="card-header">
              <div className="placeholder-glow w-50">
                <span className="placeholder col-8" />
              </div>
            </div>
            <div className="card-body placeholder-glow" style={{ minHeight: "32rem" }}>
              <span className="placeholder col-12 mb-3" />
              <span className="placeholder col-12 mb-3" />
              <span className="placeholder col-10" />
            </div>
          </div>
        ) : (
          <MonthCalendar
            courses={state.courses}
            events={events}
            month={clock.month}
            onNextMonth={() =>
              setClock((current) =>
                current ? { ...current, month: addMonths(current.month, 1) } : current,
              )
            }
            onPreviousMonth={() =>
              setClock((current) =>
                current ? { ...current, month: addMonths(current.month, -1) } : current,
              )
            }
            onTaskClick={openTask}
            onToday={showToday}
            today={clock.today}
          />
        )}
      </div>
    </div>
  );
}

export default CalendarPage;
