"use client";

import Link from "next/link";
import { IconFileUpload } from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAcademic } from "@/context/academic-context";
import { DEFAULT_DEADLINE_TIME } from "@/lib/date";
import { estimateTaskMinutes } from "@/lib/estimate";
import {
  EXTERNAL_COURSE, IMPORT_DATE_LABELS, MAX_IMPORT_BYTES, MAX_IMPORT_FILES, findImportMatches,
  guessImportCourse, priorityForDate, sameImportSlot, type ImportCandidate,
} from "@/lib/task-import";
import type { DateMeaning, TaskDraft } from "@/lib/types";

interface ReviewItem extends Omit<ImportCandidate, "estimatedMinutes"> {
  id: string;
  filename: string;
  selected: boolean;
  courseId: string;
  estimatedMinutes: string;
}

function estimateIsValid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 1440;
}


async function readFile(file: File) {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/tasks/extract", { method: "POST", body });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(payload?.items)) {
    throw new Error(typeof payload?.message === "string" ? payload.message : "File recognition failed.");
  }
  return payload.items as ImportCandidate[];
}

export function TaskImportPage() {
  const { state, importTasks } = useAcademic();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const courses = [EXTERNAL_COURSE, ...state.courses.filter((course) => course.id !== EXTERNAL_COURSE.id)];
  const selectedCount = items.filter((item) => item.selected).length;
  const today = new Date();

  async function extract() {
    if (!files.length || busy) return;
    setBusy(true);
    setMessage("");
    setItems([]);
    setIssues([]);
    try {
      const results = await Promise.allSettled(files.map(readFile));
      const next: ReviewItem[] = [];
      const failures: string[] = [];
      for (const [index, result] of results.entries()) {
        const filename = files[index]!.name;
        if (result.status === "rejected") {
          failures.push(`${filename} · ${result.reason instanceof Error ? result.reason.message : "Could not read file."}`);
          continue;
        }
        if (!result.value.length) failures.push(`${filename} · No tasks or events found.`);
        for (const [offset, item] of result.value.entries()) {
          const courseId = guessImportCourse(item.courseHint, state.courses);
          const time = item.time || (item.dateMeaning === "submission-deadline" ? DEFAULT_DEADLINE_TIME : "");
          // Prefer the estimate the model drew from the document; fall back to the local title heuristic.
          const estimate = item.estimatedMinutes ?? estimateTaskMinutes({ title: item.title, assessmentType: "other" });
          const estimatedMinutes = estimate.toString();
          const candidate = { ...item, time, courseId };
          const selected = !findImportMatches(item, state.tasks).length &&
            !next.some((existing) => sameImportSlot(existing, candidate));
          next.push({ ...candidate, id: `${index}-${offset}`, filename, estimatedMinutes, selected });
        }
      }
      setItems(next);
      setIssues(failures);
      if (next.length) setMessage(`Found ${next.length} ${next.length === 1 ? "item" : "items"}. Review before importing.`);
    } finally {
      setBusy(false);
    }
  }

  function update(id: string, changes: Partial<ReviewItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = items.filter((item) => item.selected);
    if (chosen.some((item) => !item.title.trim() || !item.date)) {
      setMessage("Enter a title and date for each selected item.");
      return;
    }
    if (chosen.some((item) => !estimateIsValid(item.estimatedMinutes))) {
      setMessage("Enter an estimate between 1 and 1,440 minutes, or leave it blank.");
      return;
    }
    const batch: TaskDraft[] = [];
    for (const item of chosen) {
      const estimatedMinutes = item.estimatedMinutes.trim() ? Number(item.estimatedMinutes) : undefined;
      const draft: TaskDraft = {
        title: item.title.trim(), courseId: item.courseId, date: item.date, time: item.time || undefined,
        dateMeaning: item.dateMeaning, assessmentType: "other", status: "not-started",
        priority: priorityForDate(item.date, today),
        ...(estimatedMinutes ? { estimatedMinutes } : {}),
        importSource: { filename: item.filename, excerpt: item.excerpt },
      };
      if (![...state.tasks, ...batch].some((existing) => sameImportSlot(existing, draft))) batch.push(draft);
    }
    importTasks(batch);
    setItems([]);
    setMessage(`Imported ${batch.length} ${batch.length === 1 ? "item" : "items"}. ${chosen.length > batch.length
      ? `Skipped ${chosen.length - batch.length} exact duplicates. ` : ""}Check My Tasks and Calendar.`);
  }

  return (
    <div className="page-body">
      <div className="container-xl">
        <PageHeader eyebrow="Academic planning" title="Import tasks"
          description="Bring deadlines and events from PDFs, screenshots, and photos into your planner." />

        <section className="card mb-4" aria-labelledby="choose-import-files">
          <div className="card-body">
            <label id="choose-import-files" className="form-label" htmlFor="task-files">Choose files</label>
            <input id="task-files" className="form-control" type="file" multiple accept=".pdf,.png,.jpeg,.jpg,.webp"
              disabled={busy} aria-describedby="task-files-help"
              onChange={(event) => {
                const next = Array.from(event.currentTarget.files ?? []);
                setItems([]);
                setMessage("");
                if (next.length > MAX_IMPORT_FILES || next.some((file) => !file.size || file.size > MAX_IMPORT_BYTES)) {
                  setFiles([]);
                  event.currentTarget.value = "";
                  setIssues(["Select up to six nonempty files, each 8 MB or smaller."]);
                  return;
                }
                setFiles(next);
                setIssues([]);
              }} />
            <p className="small text-secondary mt-2 mb-3" id="task-files-help">
              Up to six PDF, PNG, JPEG or WebP files, 8 MB each. Selected files are sent to DeepSeek when you click Read files.
            </p>
            {files.length ? <ul className="small ps-3">{files.map((file, index) => <li key={index} className="text-break">{file.name}</li>)}</ul> : null}
            <button className="btn btn-primary" type="button" disabled={!files.length || busy} onClick={extract}>
              <IconFileUpload className="icon" aria-hidden="true" /> {busy ? "Reading files…" : "Read files"}
            </button>
          </div>
        </section>
        {message || busy ? <p role="status">{busy ? "Extracting tasks and events…" : message}</p> : null}
        {issues.length ? (
          <ul className="alert alert-warning list-unstyled text-break" role="status">
            {issues.map((issue, index) => <li key={index}>{issue}</li>)}
          </ul>
        ) : null}
        {items.length ? (
          <form onSubmit={save}>
            <h2 className="h3">Review extracted items</h2>
            <p className="text-secondary">Check the dates and estimates, then select the items to add. Possible duplicates start unchecked.</p>
            {items.map((item) => {
              const matches = findImportMatches(item, state.tasks);
              return (
                <fieldset className="card mb-3" key={item.id}>
                  <div className="card-body">
                    <label className="form-check">
                      <input className="form-check-input" type="checkbox" checked={item.selected}
                        onChange={(event) => update(item.id, { selected: event.target.checked })} />
                      <span className="form-check-label">Import this item <span className="visually-hidden">{item.title}</span></span>
                    </label>
                    <div className="row g-3 mt-1">
                      <label className="col-12 col-md-8"><span className="form-label">Title</span>
                        <input className="form-control" value={item.title} maxLength={180} required={item.selected}
                          onChange={(event) => update(item.id, { title: event.target.value })} />
                      </label>
                      <label className="col-12 col-md-4"><span className="form-label">Course or category</span>
                        <select className="form-select" value={item.courseId} onChange={(event) => update(item.id, { courseId: event.target.value })}>
                          {courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}
                        </select>
                      </label>
                      <label className="col-6 col-md-3"><span className="form-label">Date</span>
                        <input className="form-control" type="date" min="1900-01-01" max="9999-12-31" value={item.date} required={item.selected}
                          onChange={(event) => update(item.id, { date: event.target.value })} />
                      </label>
                      <label className="col-6 col-md-3"><span className="form-label">Time (Hong Kong)</span>
                        <input className="form-control" type="time" value={item.time}
                          onChange={(event) => update(item.id, { time: event.target.value })} />
                      </label>
                      <label className="col-12 col-md-3"><span className="form-label">Date meaning</span>
                        <select className="form-select" value={item.dateMeaning}
                          onChange={(event) => {
                            const dateMeaning = event.target.value as DateMeaning;
                            update(item.id, {
                              dateMeaning,
                              ...(dateMeaning === "submission-deadline" && !item.time
                                ? { time: DEFAULT_DEADLINE_TIME }
                                : {}),
                            });
                          }}>
                          {Object.entries(IMPORT_DATE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </label>
                      <div className="col-6 col-md-3">
                        <label className="form-label" htmlFor={`estimate-${item.id}`}>Estimate (minutes)</label>
                        <input className="form-control" id={`estimate-${item.id}`} type="number" min="1" max="1440" step="1"
                          inputMode="numeric" value={item.estimatedMinutes}
                          aria-describedby={`estimate-help-${item.id}`}
                          onChange={(event) => update(item.id, { estimatedMinutes: event.target.value })} />
                        <span className="form-text" id={`estimate-help-${item.id}`}>Estimated from the document. Adjust if needed.</span>
                      </div>
                    </div>
                    {item.courseHint && item.courseId === EXTERNAL_COURSE.id ? <p className="small text-secondary mt-2 mb-0">Course mentioned in file · {item.courseHint}</p> : null}
                    <p className="small text-secondary text-break mt-3 mb-0"><strong>Source</strong> · {item.filename}{item.excerpt ? ` · “${item.excerpt}”` : ""}</p>
                    {item.reviewReason ? <p className="text-warning-emphasis mt-2 mb-0">{item.reviewReason}</p> : null}
                    {matches.length ? (
                      <div className="alert alert-warning mt-3 mb-0">
                        <strong>Possible duplicate</strong>
                        <ul className="mb-0 mt-1 ps-3">
                          {matches.map((match) => <li key={match.id}>
                            {match.title} · {match.date || "No date"}{match.time ? ` ${match.time}` : ""} · {match.canvasUrl ? "Canvas" : match.importSource?.filename ?? "StudyFlow"}
                          </li>)}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </fieldset>
              );
            })}
            <button className="btn btn-primary" type="submit" disabled={!selectedCount}>Import selected ({selectedCount})</button>
          </form>
        ) : message.startsWith("Imported") ? (
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-primary" href="/tasks">My Tasks</Link>
            <Link className="btn btn-outline-primary" href="/calendar">Calendar</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
