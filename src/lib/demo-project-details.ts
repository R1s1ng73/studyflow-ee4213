const projectDetails: Record<string, {
  summary: string;
  deliverables: string;
  leaderId: string;
  responsibilities: Record<string, string>;
} | undefined> = {
  "project-hci": {
    summary: "Design a student dashboard for tracking coursework, deadlines, and group progress. Validate the main workflows with undergraduate students.",
    deliverables: "Interactive dashboard prototype, usability test findings, and final design report.",
    leaderId: "member-alex",
    responsibilities: {
      "member-alex": "Coordinates the project and refines mobile wireframes.",
      "member-maya": "Implements the calendar prototype and integrates course colours.",
      "member-jonas": "Prepares the usability test script and helps run sessions.",
      "member-noor": "Synthesises participant feedback for the design report.",
    },
  },
  "project-signals": {
    summary: "Compare adaptive filter settings for reducing noise in a simulated signal.",
    deliverables: "Validated simulation, performance plots, and results slides.",
    leaderId: "member-noor",
    responsibilities: {
      "member-alex": "Validates the circuit simulation and checks output traces.",
      "member-noor": "Coordinates the study and prepares the results slides.",
      "member-liam": "Reviews signal inputs and documents the test cases.",
    },
  },
  "project-database": {
    summary: "Design a database for reserving campus rooms and preventing overlapping bookings.",
    deliverables: "Database schema, sample queries, and booking rules.",
    leaderId: "member-liam",
    responsibilities: {
      "member-alex": "Documents room availability and booking requirements.",
      "member-maya": "Prepares example reservations for query testing.",
      "member-liam": "Coordinates the project and reviews the database schema.",
    },
  },
};

export function getDemoProjectDetails(projectId: string) {
  return Object.hasOwn(projectDetails, projectId) ? projectDetails[projectId] : undefined;
}
