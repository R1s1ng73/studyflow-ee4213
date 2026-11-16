import { addDays, subDays, subHours } from "date-fns";
import { formatDateOnly } from "./date";
import { STORAGE_VERSION, type AcademicState, type Task } from "./types";

function timestamp(value: Date): string {
  return value.toISOString();
}

export function createDemoData(referenceDate = new Date()): AcademicState {
  const now = new Date(referenceDate);
  const date = (offset: number) => formatDateOnly(addDays(now, offset));
  const createdAt = timestamp(subDays(now, 14));

  const baseTask = (overrides: Omit<Task, "createdAt" | "updatedAt">): Task => ({
    ...overrides,
    createdAt,
    updatedAt: timestamp(subHours(now, 6)),
  });

  const tasks: Task[] = [
    baseTask({ id: "task-hci-report", title: "HCI usability report", courseId: "ee4213", assessmentType: "assignment", dateMeaning: "submission-deadline", date: date(3), time: "23:59", priority: "high", estimatedMinutes: 120, gradeWeight: 25, topicsCovered: "Usability testing, heuristic evaluation", status: "in-progress" }),
    baseTask({ id: "task-quiz", title: "Signals quiz 4", courseId: "ee3204", assessmentType: "quiz", dateMeaning: "scheduled-start", date: date(1), time: "10:30", priority: "high", estimatedMinutes: 30, gradeWeight: 5, status: "not-started" }),
    baseTask({ id: "task-exam", title: "Database systems exam", courseId: "cs3322", assessmentType: "exam", dateMeaning: "scheduled-start", date: date(12), time: "14:00", priority: "high", estimatedMinutes: 120, gradeWeight: 40, topicsCovered: "Transactions, indexing, normalization", status: "not-started" }),
    baseTask({ id: "task-reading", title: "Read ethics case study", courseId: "ge2410", assessmentType: "other", dateMeaning: "date-to-remember", date: date(5), priority: "low", estimatedMinutes: 15, status: "not-started" }),
    baseTask({ id: "task-lab", title: "Filter design lab", courseId: "ee3204", assessmentType: "assignment", dateMeaning: "submission-deadline", date: date(7), time: "17:00", priority: "medium", estimatedMinutes: 60, gradeWeight: 15, status: "not-started" }),
    baseTask({ id: "task-overdue", title: "Database worksheet", courseId: "cs3322", assessmentType: "assignment", dateMeaning: "submission-deadline", date: date(-2), priority: "medium", estimatedMinutes: 30, status: "not-started" }),
    baseTask({ id: "task-complete", title: "Research consent form", courseId: "ee4213", assessmentType: "other", dateMeaning: "date-to-remember", date: date(-4), priority: "medium", estimatedMinutes: 15, status: "done", statusUpdatedAt: timestamp(subDays(now, 4)) }),
    baseTask({ id: "task-no-estimate", title: "Review lecture annotations", courseId: "ge2410", assessmentType: "other", dateMeaning: "date-to-remember", date: date(9), priority: "low", status: "not-started" }),
    baseTask({ id: "group-wireframes", title: "Refine mobile wireframes", courseId: "ee4213", assessmentType: "assignment", dateMeaning: "submission-deadline", date: date(4), internalDueDate: date(2), priority: "high", estimatedMinutes: 60, status: "in-progress", projectId: "project-hci", assignedTo: "member-alex", statusUpdatedAt: timestamp(subHours(now, 16)) }),
    baseTask({ id: "group-prototype", title: "Implement calendar prototype", courseId: "ee4213", assessmentType: "assignment", dateMeaning: "submission-deadline", date: date(5), internalDueDate: date(-1), priority: "high", estimatedMinutes: 120, status: "blocked", blockerReason: "Waiting for final course colour mapping", projectId: "project-hci", assignedTo: "member-maya", statusUpdatedAt: timestamp(subHours(now, 60)) }),
    baseTask({ id: "group-script", title: "Draft usability test script", courseId: "ee4213", assessmentType: "assignment", dateMeaning: "submission-deadline", date: date(5), internalDueDate: date(1), priority: "medium", estimatedMinutes: 30, status: "done", projectId: "project-hci", assignedTo: "member-jonas", statusUpdatedAt: timestamp(subHours(now, 20)) }),
    baseTask({ id: "group-circuit", title: "Validate circuit simulation", courseId: "ee3204", assessmentType: "assignment", dateMeaning: "submission-deadline", date: date(11), internalDueDate: date(6), priority: "medium", estimatedMinutes: 60, status: "in-progress", projectId: "project-signals", assignedTo: "member-alex", statusUpdatedAt: timestamp(subHours(now, 54)) }),
    baseTask({ id: "group-slides", title: "Prepare results slides", courseId: "ee3204", assessmentType: "assignment", dateMeaning: "submission-deadline", date: date(11), internalDueDate: date(8), priority: "medium", estimatedMinutes: 45, status: "not-started", projectId: "project-signals", assignedTo: "member-noor", statusUpdatedAt: timestamp(subHours(now, 8)) }),
    baseTask({ id: "group-schema", title: "Review database schema", courseId: "cs3322", assessmentType: "assignment", dateMeaning: "submission-deadline", date: date(18), internalDueDate: date(13), priority: "low", estimatedMinutes: 30, status: "done", projectId: "project-database", assignedTo: "member-liam", statusUpdatedAt: timestamp(subDays(now, 1)) }),
  ];

  return {
    version: STORAGE_VERSION,
    currentMemberId: "member-alex",
    courses: [
      { id: "ee4213", code: "EE4213", name: "Human–Computer Interaction", color: "blue" },
      { id: "ee3204", code: "EE3204", name: "Signals and Systems", color: "azure" },
      { id: "cs3322", code: "CS3322", name: "Database Systems", color: "teal" },
      { id: "ge2410", code: "GE2410", name: "Technology and Society", color: "purple" },
    ],
    members: [
      { id: "member-alex", displayName: "Alex Chen", initials: "AC" },
      { id: "member-maya", displayName: "Maya Wong", initials: "MW" },
      { id: "member-jonas", displayName: "Jonas Lee", initials: "JL" },
      { id: "member-noor", displayName: "Noor Rahman", initials: "NR" },
      { id: "member-liam", displayName: "Liam Ho", initials: "LH" },
    ],
    tasks,
    projects: [
      { id: "project-hci", name: "Student Academic Dashboard", courseId: "ee4213", officialDeadline: date(5), memberIds: ["member-alex", "member-maya", "member-jonas", "member-noor"], taskIds: ["group-wireframes", "group-prototype", "group-script"] },
      { id: "project-signals", name: "Adaptive Filter Study", courseId: "ee3204", officialDeadline: date(11), memberIds: ["member-alex", "member-noor", "member-liam"], taskIds: ["group-circuit", "group-slides"] },
      { id: "project-database", name: "Campus Room Booking", courseId: "cs3322", officialDeadline: date(18), memberIds: ["member-alex", "member-maya", "member-liam"], taskIds: ["group-schema"] },
    ],
  };
}
