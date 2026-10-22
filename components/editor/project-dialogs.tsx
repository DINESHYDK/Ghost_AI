import type { FormEvent } from "react";

import { EditorDialog } from "@/components/editor/editor-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROJECT_NAME_MAX_LENGTH, type ProjectDialogsState } from "@/hooks/use-project-dialogs";

interface ProjectDialogsProps {
  dialogs: ProjectDialogsState;
}

export function ProjectDialogs({ dialogs }: ProjectDialogsProps) {
  const { openDialog, target, isLoading, canSubmitName, close, submit } = dialogs;
  const targetName = target?.name ?? "";

  function handleOpenChange(open: boolean) {
    if (!open) close();
  }

  return (
    <>
      <EditorDialog
        open={openDialog === "create"}
        onOpenChange={handleOpenChange}
        title="Create project"
        description="Give your architecture workspace a name."
        footer={
          <>
            <CancelButton dialogs={dialogs} />
            <Button type="submit" form="create-project-form" disabled={isLoading || !canSubmitName}>
              {isLoading ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <ProjectNameForm id="create-project-form" placeholder="e.g. Ride-sharing backend" dialogs={dialogs} />
      </EditorDialog>

      <EditorDialog
        open={openDialog === "rename"}
        onOpenChange={handleOpenChange}
        title="Rename project"
        description={`Current name: "${targetName}"`}
        footer={
          <>
            <CancelButton dialogs={dialogs} />
            <Button type="submit" form="rename-project-form" disabled={isLoading || !canSubmitName}>
              {isLoading ? "Renaming…" : "Rename"}
            </Button>
          </>
        }
      >
        <ProjectNameForm id="rename-project-form" dialogs={dialogs} />
      </EditorDialog>

      <EditorDialog
        open={openDialog === "delete"}
        onOpenChange={handleOpenChange}
        title="Delete project?"
        description={`"${targetName}" will be permanently deleted. This can't be undone.`}
        footer={
          <>
            <CancelButton dialogs={dialogs} />
            <Button variant="destructive" disabled={isLoading} onClick={() => void submit()}>
              {isLoading ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      />
    </>
  );
}

function CancelButton({ dialogs }: ProjectDialogsProps) {
  return (
    <Button variant="outline" disabled={dialogs.isLoading} onClick={dialogs.close}>
      Cancel
    </Button>
  );
}

interface ProjectNameFormProps extends ProjectDialogsProps {
  id: string;
  placeholder?: string;
}

function ProjectNameForm({ id, placeholder, dialogs }: ProjectNameFormProps) {
  const inputId = `${id}-name`;
  const errorId = `${id}-error`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void dialogs.submit();
  }

  return (
    <form id={id} onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        Project name
      </label>
      <Input
        id={inputId}
        value={dialogs.name}
        onChange={(event) => dialogs.setName(event.target.value)}
        maxLength={PROJECT_NAME_MAX_LENGTH}
        placeholder={placeholder}
        autoComplete="off"
        disabled={dialogs.isLoading}
        aria-invalid={dialogs.showRequiredError || undefined}
        aria-describedby={dialogs.showRequiredError ? errorId : undefined}
      />
      {dialogs.showRequiredError && (
        <p id={errorId} className="text-sm text-error">
          Name is required
        </p>
      )}
    </form>
  );
}
