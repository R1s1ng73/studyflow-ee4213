import { CANVAS_ORIGIN } from "./canvas";
import { STORAGE_VERSION, type AcademicState, type CourseColor, type TeamMember } from "./types";

type CanvasId = string | number;
type CanvasUser = { id: CanvasId; name: string };
type CanvasCourse = { id: CanvasId; name?: string; course_code?: string; access_restricted_by_date?: boolean };
type CanvasAssignment = {
  id: CanvasId;
  name: string;
  published?: boolean;
  due_at: string | null;
  created_at?: string;
  updated_at?: string;
  group_category_id?: CanvasId | null;
  is_quiz_assignment?: boolean;
  submission_types?: string[];
  submission?: { workflow_state?: string; submitted_at?: string | null; excused?: boolean; missing?: boolean };
};

const colours: CourseColor[] = ["blue", "azure", "teal", "purple", "orange", "pink"];
const hongKong = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Hong_Kong", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function dateAndTime(date: Date) {
  const parts = Object.fromEntries(hongKong.formatToParts(date).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function timestamp(value: string | undefined, fallback: string) {
  return value && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : fallback;
}

function canvasId(value: unknown): string | undefined {
  if (typeof value === "string" && /^[1-9]\d*$/.test(value)) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return String(value);
}

export class CanvasRequestError extends Error {
  constructor(readonly status: number) {
    super("Canvas request failed.");
  }
}

export async function loadCanvasWorkspace(token: string, now = new Date()): Promise<AcademicState> {
  const startedAt = now.toISOString();
  const today = dateAndTime(now).date;
  const inThreeDays = dateAndTime(new Date(now.getTime() + 3 * 86_400_000)).date;
  const inSevenDays = dateAndTime(new Date(now.getTime() + 7 * 86_400_000)).date;
  const signal = AbortSignal.timeout(45_000);

  async function request(url: URL) {
    if (url.origin !== CANVAS_ORIGIN || !url.pathname.startsWith("/api/v1/")) {
      throw new Error("Unexpected Canvas pagination URL.");
    }
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json+canvas-string-ids" },
      cache: "no-store", redirect: "error", signal,
    });
    if (!response.ok) throw new CanvasRequestError(response.status);
    return response;
  }

  async function list<T>(path: string): Promise<T[]> {
    let url: URL | undefined = new URL(path, CANVAS_ORIGIN);
    url.searchParams.set("per_page", "100");
    const items: T[] = [];
    const visited = new Set<string>();
    while (url) {
      if (visited.has(url.href)) throw new Error("Repeated Canvas pagination URL.");
      visited.add(url.href);
      const response = await request(url);
      const page: unknown = await response.json();
      if (!Array.isArray(page)) throw new Error("Unexpected Canvas list response.");
      items.push(...page as T[]);
      const next: string | undefined = response.headers.get("link")?.match(/<([^>]+)>\s*;\s*rel="next"/i)?.[1];
      url = next ? new URL(next, url) : undefined;
    }
    return items;
  }

  function member(user: CanvasUser): TeamMember {
    const id = canvasId(user.id);
    if (!id || typeof user.name !== "string") throw new Error("Invalid Canvas user.");
    return {
      id: `canvas-user-${id}`,
      displayName: user.name,
      initials: user.name.trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join("").toUpperCase(),
    };
  }

  const [profileResponse, enrolled] = await Promise.all([
    request(new URL("/api/v1/users/self/profile", CANVAS_ORIGIN)),
    list<CanvasCourse>("/api/v1/courses?enrollment_type=student&enrollment_state=active"),
  ]);
  const profile = await profileResponse.json() as CanvasUser;
  const currentMember = member(profile);
  const members = new Map([[currentMember.id, currentMember]]);
  const state: AcademicState = { version: STORAGE_VERSION, currentMemberId: currentMember.id, courses: [], members: [], tasks: [], projects: [] };

  for (const course of new Map(enrolled.map((course) => [canvasId(course.id), course])).values()) {
    const id = canvasId(course.id);
    if (!course.name || course.access_restricted_by_date || !id) continue;
    const courseId = `canvas-course-${id}`;
    state.courses.push({
      id: courseId, code: course.course_code || course.name, name: course.name,
      color: colours[Number(BigInt(id) % BigInt(colours.length))]!,
    });
    const coursePath = `/api/v1/courses/${id}`;
    const assignments = await list<CanvasAssignment>(
      `${coursePath}/assignments?include%5B%5D=submission&override_assignment_dates=true`,
    );
    for (const assignment of new Map(assignments.map((assignment) => [canvasId(assignment.id), assignment])).values()) {
      if (assignment.published === false) continue;
      const assignmentId = canvasId(assignment.id);
      if (!assignmentId || typeof assignment.name !== "string") throw new Error("Invalid Canvas assignment.");
      const deadline = assignment.due_at ? dateAndTime(new Date(assignment.due_at)) : { date: "" };
      const canvasUrl = `${CANVAS_ORIGIN}/courses/${id}/assignments/${assignmentId}`;
      const taskId = `canvas-task-${id}-${assignmentId}`;
      const projectId = canvasId(assignment.group_category_id) ? `canvas-project-${id}-${assignmentId}` : undefined;
      const submission = assignment.submission;
      const done = Boolean(submission?.excused || submission?.submitted_at || (!submission?.missing &&
        ["submitted", "graded", "pending_review"].includes(submission?.workflow_state ?? "")));

      if (projectId) {
        let group: CanvasUser[] = [];
        try {
          group = await list<CanvasUser>(`${coursePath}/assignments/${assignmentId}/users/${profile.id}/group_members`);
        } catch (error) {
          if (!(error instanceof CanvasRequestError) || ![401, 403, 404].includes(error.status)) throw error;
        }
        const groupMembers = group.map(member);
        groupMembers.forEach((teammate) => members.set(teammate.id, teammate));
        state.projects.push({
          id: projectId, name: assignment.name, courseId, canvasUrl,
          officialDeadline: deadline.date, taskIds: [taskId],
          memberIds: [...new Set(groupMembers.map((teammate) => teammate.id))],
        });
      }

      state.tasks.push({
        id: taskId, title: assignment.name, courseId, projectId, canvasUrl, ...deadline,
        assessmentType: assignment.is_quiz_assignment || assignment.submission_types?.includes("online_quiz") ? "quiz" : "assignment",
        dateMeaning: "submission-deadline",
        status: done ? "done" : "not-started",
        priority: !deadline.date ? "low" : deadline.date >= today && deadline.date <= inThreeDays ? "high" :
          deadline.date < today || deadline.date <= inSevenDays ? "medium" : "low",
        createdAt: timestamp(assignment.created_at, startedAt),
        updatedAt: timestamp(assignment.updated_at, startedAt),
      });
    }
  }
  state.members = [...members.values()];
  return state;
}
