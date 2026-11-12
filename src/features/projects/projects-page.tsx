"use client";

import { useState } from "react";
import { IconInfoCircle, IconPlus, IconUsersGroup } from "@tabler/icons-react";
import { PageHeader } from "@/components/layout/page-header";
import { useAcademic } from "@/context/academic-context";
import { getProjectProgress } from "@/lib/selectors";
import type { Task, TaskStatus } from "@/lib/types";
import { GroupTaskDialog } from "@/components/projects/group-task-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectDetail } from "@/components/projects/project-detail";
import {
  getLatestProjectUpdate,
  getProjectTasks,
  type ProjectTaskFilter,
} from "@/components/projects/project-utils";

export function ProjectsPage() {
  const { state, isHydrated, openTask, updateTask } = useAcademic();
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [filter, setFilter] = useState<ProjectTaskFilter>("all");
  const [editingTask, setEditingTask] = useState<Task>();
  const [now] = useState(() => new Date());

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

  function selectProject(projectId: string) {
    setSelectedProjectId(projectId);
    setFilter("all");
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
          <h2 className="alert-heading h4 mb-1">Reported demonstration data</h2>
          <p className="mb-0">
            These are fictional team updates for usability testing. Changes are saved locally in this
            browser and are not live collaboration data. Tasks are marked for attention when they are
            blocked, overdue, or have no recorded status update for more than 48 hours.
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
              Group projects will appear here when they are added to the shared academic data.
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
            project={selectedProject}
            course={state.courses.find((course) => course.id === selectedProject.courseId)}
            members={selectedProject.memberIds
              .map((memberId) => state.members.find((member) => member.id === memberId))
              .filter((member): member is (typeof state.members)[number] => Boolean(member))}
            tasks={getProjectTasks(state, selectedProject)}
            filter={filter}
            onFilterChange={setFilter}
            onUpdateStatus={setEditingTask}
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
        </div>
      </div>
    </div>
  );
}
