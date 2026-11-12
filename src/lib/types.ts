export const STORAGE_VERSION = 1 as const;

export type CourseColor = "blue" | "azure" | "teal" | "purple" | "orange" | "pink";
export type AssessmentType = "assignment" | "quiz" | "test" | "exam" | "other";
export type DateMeaning = "submission-deadline" | "scheduled-start" | "date-to-remember";
export type Priority = "high" | "medium" | "low";
export type TaskStatus = "not-started" | "in-progress" | "blocked" | "done";

export interface Course {
  id: string;
  code: string;
  name: string;
  color: CourseColor;
}

export interface TeamMember {
  id: string;
  displayName: string;
  initials: string;
}

export interface Task {
  id: string;
  title: string;
  courseId: string;
  assessmentType: AssessmentType;
  dateMeaning: DateMeaning;
  date: string;
  time?: string;
  priority: Priority;
  estimatedMinutes?: number;
  gradeWeight?: number;
  topicsCovered?: string;
  notes?: string;
  status: TaskStatus;
  projectId?: string;
  assignedTo?: string;
  internalDueDate?: string;
  blockerReason?: string;
  createdAt: string;
  updatedAt: string;
  statusUpdatedAt?: string;
}

export interface GroupProject {
  id: string;
  name: string;
  courseId: string;
  officialDeadline: string;
  memberIds: string[];
  taskIds: string[];
}

export interface AcademicState {
  version: typeof STORAGE_VERSION;
  currentMemberId: string;
  courses: Course[];
  members: TeamMember[];
  tasks: Task[];
  projects: GroupProject[];
}

export interface DashboardMetrics {
  upcomingDeadlines: number;
  urgentOrOverdue: number;
  unfinishedPersonal: number;
  groupNeedsAttention: number;
}

export interface ProjectProgress {
  completed: number;
  total: number;
  percentage: number;
  blocked: number;
  needsAttention: number;
}

export interface CalendarEvent {
  id: string;
  sourceId: string;
  sourceType: "task" | "project";
  date: string;
  time?: string;
  title: string;
  courseId: string;
  category: AssessmentType | "group-task" | "project-deadline";
  completed: boolean;
  dateMeaning: DateMeaning | "official-project-deadline" | "internal-deadline";
}

export type TaskDraft = Omit<Task, "id" | "createdAt" | "updatedAt" | "statusUpdatedAt">;
