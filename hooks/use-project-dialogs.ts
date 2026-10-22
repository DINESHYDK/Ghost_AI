"use client";

import { useState } from "react";

import type { ProjectListItem } from "@/types/project";

export const PROJECT_NAME_MAX_LENGTH = 60;

export type ProjectDialogKind = "create" | "rename" | "delete";

interface ProjectDialogOperations {
  onCreate: (name: string) => void | Promise<void>;
  onRename: (id: string, name: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function validateProjectName(value: string, currentName?: string) {
  const trimmed = value.trim();
  const isEmpty = trimmed.length === 0;
  const isTooLong = trimmed.length > PROJECT_NAME_MAX_LENGTH;
  const isUnchanged = currentName !== undefined && trimmed === currentName;
  return { trimmed, isEmpty, isTooLong, isUnchanged, isValid: !isEmpty && !isTooLong && !isUnchanged };
}

export function useProjectDialogs({ onCreate, onRename, onDelete }: ProjectDialogOperations) {
  const [openDialog, setOpenDialog] = useState<ProjectDialogKind | null>(null);
  const [target, setTarget] = useState<ProjectListItem | null>(null);
  const [name, setNameValue] = useState("");
  const [isTouched, setIsTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validation = validateProjectName(name, openDialog === "rename" ? target?.name : undefined);

  function open(kind: ProjectDialogKind, project: ProjectListItem | null) {
    if (isLoading) return;
    setTarget(project);
    setNameValue(kind === "rename" && project ? project.name : "");
    setIsTouched(false);
    setOpenDialog(kind);
  }

  function setName(value: string) {
    setNameValue(value);
    setIsTouched(true);
  }

  function close() {
    if (isLoading) return;
    setOpenDialog(null);
  }

  async function submit() {
    if (isLoading || !openDialog) return;
    if (openDialog !== "delete" && !validation.isValid) return;
    if (openDialog !== "create" && !target) return;

    setIsLoading(true);
    try {
      if (openDialog === "create") await onCreate(validation.trimmed);
      if (openDialog === "rename" && target) await onRename(target.id, validation.trimmed);
      if (openDialog === "delete" && target) await onDelete(target.id);
      setOpenDialog(null);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    openDialog,
    target,
    name,
    setName,
    isLoading,
    canSubmitName: validation.isValid,
    showRequiredError: isTouched && validation.isEmpty,
    openCreate: () => open("create", null),
    openRename: (project: ProjectListItem) => open("rename", project),
    openDelete: (project: ProjectListItem) => open("delete", project),
    close,
    submit,
  };
}

export type ProjectDialogsState = ReturnType<typeof useProjectDialogs>;
