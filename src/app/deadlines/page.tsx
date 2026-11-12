import type { Metadata } from "next";
import { DeadlinesPage } from "@/features/deadlines/deadlines-page";

export const metadata: Metadata = { title: "Deadlines" };

export default function DeadlinesRoute() {
  return <DeadlinesPage />;
}
