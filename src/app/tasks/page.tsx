import type { Metadata } from "next";
import { MyTasksPage } from "@/features/tasks/my-tasks-page";

export const metadata: Metadata = { title: "My Tasks" };

export default function TasksRoute() {
  return <MyTasksPage />;
}
