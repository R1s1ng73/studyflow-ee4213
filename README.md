# StudyFlow — Student Academic Management Dashboard

StudyFlow is a local-first academic productivity prototype for EE4213. It brings deadline capture, task prioritisation, group-project progress, and a unified calendar into one responsive Tabler UI workspace.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Changes are stored in the browser under a versioned localStorage key. Use **Reset demo data** in the navigation to restore the fictional demonstration records.

## Verification commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Implemented modules

- Dashboard metrics, upcoming deadlines, short tasks, and project progress derived from shared records.
- Deadline capture with validation, optional details, editing, deletion, completion, and persistence.
- High Impact and Short Tasks modes with manual priorities and editable duration estimates.
- Group project overview and responsive detail views: a full task table on desktop and readable task cards on mobile, with reported statuses, owners, blockers, progress, and attention rules.
- Monthly calendar generated from the same tasks and project deadlines used by every other view.
- Quick Wins preserves duration-based recommendations while explicitly identifying unfinished overdue work.

## Deploy to Vercel

1. Push the repository to a Git provider.
2. Import the repository in Vercel.
3. Keep the detected framework as **Next.js** and the build command as `npm run build`.
4. Deploy. No environment variables or backend services are required.

The app is a single-browser prototype: it has no accounts, server database, real-time collaboration, or external calendar integration. Group status updates are recorded locally and are not evidence of live teammate activity.

## Project documentation

- [Architecture](docs/architecture.md)
- [Feature mapping](docs/feature-mapping.md)
- [Design rationale](docs/design-rationale.md)
- [Testing checklist](docs/testing-checklist.md)
- [Usability iteration log](docs/usability-iteration.md)
- [AI collaboration record](docs/ai-collaboration.md)
