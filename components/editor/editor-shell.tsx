"use client";

import { useState } from "react";

import { EditorHome } from "@/components/editor/editor-home";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { createMockProjectId, initialMockProjects, simulateRequest } from "@/lib/mock-projects";
import type { ProjectListItem } from "@/types/project";

export function EditorShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectListItem[]>(initialMockProjects);

  const dialogs = useProjectDialogs({
    onCreate: async (name) => {
      await simulateRequest();
      setProjects((current) => [...current, { id: createMockProjectId(), name, isOwner: true }]);
    },
    onRename: async (id, name) => {
      await simulateRequest();
      setProjects((current) => current.map((project) => (project.id === id ? { ...project, name } : project)));
    },
    onDelete: async (id) => {
      await simulateRequest();
      setProjects((current) => current.filter((project) => project.id !== id));
    },
  });

  return (
    <div className="flex flex-1 flex-col">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        onCreate={dialogs.openCreate}
        onRename={dialogs.openRename}
        onDelete={dialogs.openDelete}
      />
      <main className="flex flex-1 bg-page">
        <EditorHome onCreateProject={dialogs.openCreate} />
      </main>
      <ProjectDialogs dialogs={dialogs} />
    </div>
  );
}
