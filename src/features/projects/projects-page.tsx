"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { IconInfoCircle, IconPlus, IconUsersGroup } from "@tabler/icons-react";
import { PageHeader } from "@/components/layout/page-header";
import { useAcademic } from "@/context/academic-context";
import { getProjectProgress } from "@/lib/selectors";
import type { Task, TaskStatus } from "@/lib/types";
import { GroupTaskDialog } from "@/components/projects/group-task-dialog";
import {
  InternalSubtaskDialog,
  type InternalSubtaskValues,
} from "@/components/projects/internal-subtask-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectDetail } from "@/components/projects/project-detail";
import {
  getLatestProjectUpdate,
  getProjectTasks,
  type ProjectTaskFilter,
} from "@/components/projects/project-utils";

export function ProjectsPage() {
  const { state, isHydrated, openTask, updateTask, addTask, deleteTask, showToast } = useAcademic();
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [filter, setFilter] = useState<ProjectTaskFilter>("all");
  const [editingTask, setEditingTask] = useState<Task>();
  const [subtaskDialog, setSubtaskDialog] = useState<{ task?: Task } | null>(null);
  const [now] = useState(() => new Date());
  const detailHeadingRef = useRef<HTMLHeadingElement>(null);

  if (!isHydrated) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="card" aria-busy="true">
            <div className="card-body text-secondary">Loading group projects…</div>
          </div>
        </div>
      </div>
    );
  }

  const selectedProject =
    (state.projects.find((project) => project.id === selectedProjectId) ?? state.projects[0])!;
  const selectedProjectMembers = selectedProject.memberIds
    .map((memberId) => state.members.find((member) => member.id === memberId))
    .filter((member): member is (typeof state.members)[number] => Boolean(member));

  function selectProject(projectId: string) {
    flushSync(() => {
      setSelectedProjectId(projectId);
      setFilter("all");
    });
    detailHeadingRef.current?.focus({ preventScroll: true });
    detailHeadingRef.current?.scrollIntoView({ block: "start" });
  }

  function saveReportedStatus(status: TaskStatus, blockerReason?: string) {
    if (!editingTask) return;
    updateTask(
      editingTask.id,
      { status, blockerReason, statusUpdatedAt: new Date().toISOString() },
      `Reported status for ${editingTask.title} was updated.`,
    );
    setEditingTask(undefined);
  }

  function saveSubtask(values: InternalSubtaskValues) {
    if (!subtaskDialog) return;
    const existing = subtaskDialog.task;
    if (existing) {
      updateTask(
        existing.id,
        {
          title: values.title,
          date: values.internalDueDate,
          internalDueDate: values.internalDueDate,
          assignedTo: values.assignedTo,
          notes: values.notes,
        },
        `Internal deadline for ${values.title} was saved.`,
      );
    } else {
      addTask({
        title: values.title,
        courseId: selectedProject.courseId,
        assessmentType: "other",
        dateMeaning: "submission-deadline",
        date: values.internalDueDate,
        internalDueDate: values.internalDueDate,
        priority: "medium",
        status: "not-started",
        projectId: selectedProject.id,
        ...(values.assignedTo ? { assignedTo: values.assignedTo } : {}),
        ...(values.notes ? { notes: values.notes } : {}),
        ...(state.currentMemberId ? { createdBy: state.currentMemberId } : {}),
      });
      setFilter("all");
      showToast(`${values.title} was added to ${selectedProject.name} with an internal deadline.`);
    }
    setSubtaskDialog(null);
  }

  function deleteSubtask() {
    if (!subtaskDialog?.task) return;
    deleteTask(subtaskDialog.task.id);
    setSubtaskDialog(null);
  }

  const subtaskCreator = subtaskDialog?.task?.createdBy
    ? state.members.find((member) => member.id === subtaskDialog.task?.createdBy)?.displayName ?? "You"
    : undefined;

  return (
    <div className="page-body">
      <div className="container-xl">
        <PageHeader
          eyebrow="Team coordination"
          title="Group Projects"
          description="Review recorded responsibilities, internal deadlines and reported progress across active projects."
          actions={
            <button className="btn btn-primary" type="button" onClick={() => openTask()}>
              <IconPlus className="icon" aria-hidden="true" /> Add task
            </button>
          }
        />
        <div className="d-flex flex-column gap-4">
      <div className="alert alert-info mb-0" role="note">
        <IconInfoCircle className="icon alert-icon" aria-hidden="true" />
        <div>
          <h2 className="alert-heading h4 mb-1">Canvas group assignments</h2>
          <p className="mb-0">
            StudyFlow shows the group assignments and student names Canvas makes available.
            Submission status comes from Canvas. Team roles are not inferred; internal subtasks
            and deadlines you add here stay in this browser.
          </p>
        </div>
      </div>

      {state.projects.length === 0 ? (
        <div className="card">
          <div className="empty py-5">
            <div className="empty-icon">
              <IconUsersGroup className="icon" aria-hidden="true" />
            </div>
            <p className="empty-title">No group projects recorded</p>
            <p className="empty-subtitle text-secondary">
              Group assignments will appear here after a successful Canvas sync.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section aria-labelledby="project-overview-title">
            <div className="d-flex align-items-end justify-content-between gap-3 mb-3">
              <div>
                <h2 className="h3 mb-1" id="project-overview-title">
                  Project overview
                </h2>
                <p className="text-secondary mb-0">Progress is calculated from the shared task list.</p>
              </div>
            </div>
            <div className="row row-cards">
              {state.projects.map((project) => {
                const tasks = getProjectTasks(state, project);
                const members = project.memberIds
                  .map((memberId) => state.members.find((member) => member.id === memberId))
                  .filter((member): member is (typeof state.members)[number] => Boolean(member));
                return (
                  <div className="col-12 col-lg-6 col-xxl-4" key={project.id}>
                    <ProjectCard
                      project={project}
                      course={state.courses.find((course) => course.id === project.courseId)}
                      members={members}
                      progress={getProjectProgress(state, project, now)}
                      latestUpdate={getLatestProjectUpdate(tasks)}
                      selected={project.id === selectedProject.id}
                      onSelect={() => selectProject(project.id)}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <ProjectDetail
            key={selectedProject.id}
            headingRef={detailHeadingRef}
            project={selectedProject}
            course={state.courses.find((course) => course.id === selectedProject.courseId)}
            members={selectedProjectMembers}
            tasks={getProjectTasks(state, selectedProject)}
            filter={filter}
            currentMemberId={state.currentMemberId}
            onFilterChange={setFilter}
            onUpdateStatus={setEditingTask}
            onAddSubtask={() => setSubtaskDialog({})}
            onEditSubtask={(task) => setSubtaskDialog({ task })}
            now={now}
          />
        </>
      )}

          {editingTask ? (
            <GroupTaskDialog
              key={editingTask.id}
              task={editingTask}
              onClose={() => setEditingTask(undefined)}
              onSave={saveReportedStatus}
            />
          ) : null}

          {subtaskDialog ? (
            <InternalSubtaskDialog
              key={subtaskDialog.task?.id ?? `new-subtask-${selectedProject.id}`}
              projectName={selectedProject.name}
              members={selectedProjectMembers}
              subtask={subtaskDialog.task}
              creatorName={subtaskCreator}
              onClose={() => setSubtaskDialog(null)}
              onSave={saveSubtask}
              onDelete={subtaskDialog.task ? deleteSubtask : undefined}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
