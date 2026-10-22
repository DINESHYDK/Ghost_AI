import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorHomeProps {
  onCreateProject: () => void;
}

export function EditorHome({ onCreateProject }: EditorHomeProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="flex max-w-xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl leading-[1.1] font-semibold tracking-[-0.01em] md:text-[38px]">
          Create a project or open an existing one
        </h1>
        <p className="text-copy-muted">
          Start a new architecture workspace, or choose a project from the sidebar.
        </p>
        <Button onClick={onCreateProject} className="mt-2">
          <Plus data-icon="inline-start" />
          New Project
        </Button>
      </div>
    </div>
  );
}
