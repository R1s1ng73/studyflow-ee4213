import type { Metadata } from "next";
import { AcademicProvider } from "@/context/academic-context";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StudyFlow",
    template: "%s · StudyFlow",
  },
  description: "A local-first academic management dashboard for EE4213.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-bs-theme="light">
      <body>
        <AcademicProvider>
          <AppShell>{children}</AppShell>
        </AcademicProvider>
      </body>
    </html>
  );
}
