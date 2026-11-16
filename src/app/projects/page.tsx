import type { Metadata } from "next";
import { ProjectsPage } from "@/features/projects/projects-page";

export const metadata: Metadata = { title: "Group Projects" };

export default function ProjectsRoute() {
  return <ProjectsPage />;
}
