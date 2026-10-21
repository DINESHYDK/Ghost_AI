import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { PROJECT_SIDEBAR_ID } from "@/components/editor/project-sidebar";
import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({ isSidebarOpen, onToggleSidebar }: EditorNavbarProps) {
  return (
    <header className="sticky top-0 z-40 grid h-12 w-full grid-cols-[1fr_auto_1fr] items-center border-b border-surface-border bg-nav px-2 backdrop-blur">
      <div className="flex items-center justify-start gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar"}
          aria-expanded={isSidebarOpen}
          aria-controls={PROJECT_SIDEBAR_ID}
        >
          {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </div>
      <div className="flex items-center justify-center gap-1" />
      <div className="flex items-center justify-end gap-1" />
    </header>
  );
}
