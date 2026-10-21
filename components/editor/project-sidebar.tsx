import type { KeyboardEvent } from "react";
import { FolderOpen, Plus, Users, X, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const PROJECT_SIDEBAR_ID = "project-sidebar";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") onClose();
  }

  return (
    <aside
      id={PROJECT_SIDEBAR_ID}
      aria-label="Projects"
      inert={!isOpen}
      onKeyDown={handleKeyDown}
      className={cn(
        "fixed top-14 bottom-2 left-0 z-40 box-content w-80 pl-2 transition-[translate,visibility] duration-200 ease-out motion-reduce:transition-none",
        isOpen ? "visible translate-x-0" : "invisible -translate-x-full",
      )}
    >
      <div className="flex h-full flex-col rounded-md border border-surface-border bg-elevated shadow-md">
        <div className="flex items-center justify-between py-2 pr-2 pl-4">
          <h2 className="text-sm font-semibold">Projects</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close sidebar">
            <X />
          </Button>
        </div>

        <Tabs defaultValue="my-projects" className="min-h-0 flex-1 gap-0">
          <div className="px-3 pb-2">
            <TabsList className="w-full">
              <TabsTrigger value="my-projects">My Projects</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <TabsContent value="my-projects">
              <EmptyState icon={FolderOpen} message="No projects yet" />
            </TabsContent>
            <TabsContent value="shared">
              <EmptyState icon={Users} message="Nothing shared with you yet" />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="border-t border-surface-border p-3">
          <Button className="w-full">
            <Plus data-icon="inline-start" />
            New Project
          </Button>
        </div>
      </div>
    </aside>
  );
}

function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <Icon className="h-8 w-8 text-copy-muted" aria-hidden="true" />
      <p className="text-sm text-copy-muted">{message}</p>
    </div>
  );
}
