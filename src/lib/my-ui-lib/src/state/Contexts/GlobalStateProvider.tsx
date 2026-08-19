// src/state/Contexts/GlobalStateProvider.tsx
import React, { createContext, useMemo, ReactNode } from "react";
import {
  useTasks,
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from "../../../../../features/tasks/hooks";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../../features/auth/AuthProvider";

/* ---------------- Types ---------------- */

export type TaskUI = {
  id: string;
  name: string;
  start: string | null;
  end: string | null;
  hours?: number;
  progress: number;
  parentId?: string | null;
  position?: number;
  dependencies: string[];
  description?: string;
  status?: string;
  priority?: "low" | "medium" | "high";

  expected_deadline?: string | null;
  submission_status?: "not_started" | "in_progress" | "submitted" | null;
  approval_date?: string | null;
  stage_notes?: string | null;

  created_by_email?: string | null;

  audit_history?: Array<{
    id: string;
    field_name: string;
    old_value: string | null;
    new_value: string | null;
    note: string;
    changed_at: string;
    changed_by: {
      user_id: string;
      email: string;
      full_name: string | null;
    };
  }>;
};

type GlobalContextType = {
  tasks: TaskUI[];
  projectId: string;
  handleAddTask: (task: Partial<TaskUI>, insertIndex?: number) => Promise<void>;
  handleDeleteTask: (id: string) => Promise<void>;
  patchTaskDebounced: (
    id: string,
    patch: Partial<TaskUI> & { dependencies?: string[]; audit_entries?: any[] }
  ) => Promise<void>;
  flushTaskDebounce?: (id: string) => void;
};

export const GlobalContext = createContext<GlobalContextType | null>(null);

/* ---------------- helpers ---------------- */

const addDays = (d: Date, days: number) =>
  new Date(d.getTime() + days * 86400000);

function normalizeDeps(deps: unknown, selfId?: string): string[] {
  const arr = Array.isArray(deps)
    ? deps
    : deps
      ? String(deps)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  return Array.from(new Set(arr.filter((x) => (selfId ? x !== selfId : true))));
}

// FIXED: Safe mapping with proper undefined checks and null handling
function buildMappedPatch(patch: Partial<TaskUI> & { dependencies?: string[] }) {
  const mapped: any = {};

  if (patch.name != null) mapped.name = patch.name;

  if (patch.start !== undefined) {
    mapped.start_date = patch.start ? patch.start.slice(0, 10) : null;
  }

  if (patch.end !== undefined) {
    mapped.end_date = patch.end ? patch.end.slice(0, 10) : null;
  }

  if (patch.hours !== undefined) mapped.hours = patch.hours;
  if (patch.parentId !== undefined) mapped.parent_id = patch.parentId;
  if (patch.position !== undefined) mapped.position = patch.position;
  if (patch.progress !== undefined) mapped.progress = patch.progress;
  if (patch.dependencies !== undefined) mapped.dependencies = patch.dependencies;

  if ((patch as any).assignees !== undefined)
    mapped.assignees = (patch as any).assignees;
  if ((patch as any).allocations !== undefined)
    mapped.allocations = (patch as any).allocations;

  if (patch.description !== undefined) mapped.description = patch.description;
  if (patch.status !== undefined) mapped.status = patch.status;
  if (patch.priority !== undefined) mapped.priority = patch.priority;

  if (patch.expected_deadline !== undefined)
    mapped.expected_deadline = patch.expected_deadline ? patch.expected_deadline.slice(0, 10) : null;
  if (patch.submission_status !== undefined) mapped.submission_status = patch.submission_status;
  if (patch.approval_date !== undefined)
    mapped.approval_date = patch.approval_date ? patch.approval_date.slice(0, 10) : null;
  if (patch.stage_notes !== undefined) mapped.stage_notes = patch.stage_notes;

  return mapped;
}

/* ---------------- Dependency Logic ---------------- */

function adjustTaskForOwnDependencies(task: TaskUI, all: TaskUI[]): boolean {
  const depTasks = task.dependencies
    .map((id) => all.find((t) => t.id === id))
    .filter(Boolean) as TaskUI[];

  if (depTasks.length === 0) return false;

  const depEndTimes = depTasks
    .map((d) => (d.end ? new Date(d.end).getTime() : undefined))
    .filter((t): t is number => t !== undefined);
  if (depEndTimes.length === 0 || !task.start || !task.end) return false;

  const latestEnd = new Date(Math.max(...depEndTimes));
  const minStart = addDays(latestEnd, 1);
  const curStart = new Date(task.start);

  if (curStart >= minStart) return false;

  const durationDays = Math.max(
    0,
    Math.round((new Date(task.end).getTime() - curStart.getTime()) / 86400000)
  );
  const newStart = minStart;
  const newEnd = addDays(newStart, durationDays);

  task.start = newStart.toISOString();
  task.end = newEnd.toISOString();
  return true;
}

function cascadeFrom(sourceId: string, all: TaskUI[]): Set<string> {
  const changed = new Set<string>();
  const idMap = new Map(all.map((t) => [t.id, t]));
  const queue: string[] = [sourceId];

  while (queue.length) {
    const currentId = queue.shift()!;
    const src = idMap.get(currentId);
    if (!src || !src.end) continue;

    const dependents = all.filter((t) =>
      (t.dependencies || []).includes(currentId)
    );

    for (const dep of dependents) {
      if (!dep.start || !dep.end) continue;

      const duration =
        (new Date(dep.end).getTime() - new Date(dep.start).getTime()) /
        86400000;
      const minStart = addDays(new Date(src.end), 1);

      if (new Date(dep.start) < minStart) {
        dep.start = minStart.toISOString();
        dep.end = addDays(minStart, duration).toISOString();
        if (!changed.has(dep.id)) {
          changed.add(dep.id);
          queue.push(dep.id);
        }
      }
    }
  }
  return changed;
}

/* ---------------- Hierarchy Builder ---------------- */

function buildHierarchyFlat(tasks: TaskUI[]): TaskUI[] {
  const childrenByParent = new Map<string | null, TaskUI[]>();
  tasks.forEach((t) => {
    const key = t.parentId ?? "__root__";
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key)!.push(t);
  });

  const sortByPos = (a: TaskUI, b: TaskUI) =>
    (a.position ?? 0) - (b.position ?? 0);

  const out: TaskUI[] = [];
  const visited = new Set<string>();

  const walk = (parentId: string | null) => {
    const bucket = childrenByParent.get(parentId ?? "__root__") || [];
    bucket.sort(sortByPos).forEach((t) => {
      if (visited.has(t.id) || t.id === parentId) return;
      visited.add(t.id);
      out.push(t);
      walk(t.id);
    });
  };

  walk(null);
  return out;
}

/* ---------------- Provider ---------------- */

const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = useAuth();

  const { data } = useTasks(projectId!, true, 1, 9999, undefined, undefined, undefined, true);
  const dbTasks = data?.tasks ?? [];

  const createTask = useCreateTask(projectId!);
  const deleteTask = useDeleteTask(projectId!);
  const updateTask = useUpdateTask(projectId!);

  const [localTasks, setLocalTasks] = React.useState<TaskUI[]>([]);

  React.useEffect(() => {
    setLocalTasks(
      (dbTasks ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        start: t.start_date ? new Date(t.start_date).toISOString() : null,
        end: t.end_date ? new Date(t.end_date).toISOString() : null,
        hours: t.hours ?? null,
        progress: t.progress ?? 0,
        parentId: t.parent_id ?? null,
        position: t.position ?? 0,
        dependencies: normalizeDeps(t.dependencies, t.id),
        assignees: t.assignees ?? [],
        description: t.description ?? "",
        status: t.status ?? "todo",
        priority: t.priority ?? "medium",
        created_by_email: t.created_by_email ?? null,
        expected_deadline: t.expected_deadline ? new Date(t.expected_deadline).toISOString() : null,
        submission_status: t.submission_status ?? null,
        approval_date: t.approval_date ? new Date(t.approval_date).toISOString() : null,
        stage_notes: t.stage_notes ?? null,
        audit_history: t.audit_history ?? [],
      }))
    );
  }, [dbTasks]);

  const tasks = useMemo(() => buildHierarchyFlat([...localTasks]), [localTasks]);

  const handleAddTask = async (task: Partial<TaskUI>, insertIndex?: number) => {
    const tempId = "tmp-" + Date.now();

    const optimistic: TaskUI = {
      id: tempId,
      name: task.name ?? "New Stage",
      start: task.start === undefined ? null : task.start,
      end: task.end === undefined ? null : task.end,
      hours: task.hours ?? null,
      progress: task.progress ?? 0,
      parentId: task.parentId ?? null,
      position: task.position ?? ((insertIndex ?? tasks.length) + 1) * 1000,
      dependencies: [],
      description: "",
      status: "todo",
      priority: "medium",
      created_by_email: profile?.email || null,

      expected_deadline: task.expected_deadline ?? null,
      submission_status: task.submission_status ?? null,
      approval_date: task.approval_date ?? null,
      stage_notes: task.stage_notes ?? null,

      audit_history: [],
    };

    setLocalTasks((prev) => [...prev, optimistic]);

    try {
      const created = await createTask.mutateAsync({
        name: optimistic.name,
        start_date: optimistic.start ? optimistic.start.slice(0, 10) : undefined,
        end_date: optimistic.end ? optimistic.end.slice(0, 10) : undefined,
        progress: optimistic.progress,
        parent_id: optimistic.parentId,
        position: optimistic.position,
        description: optimistic.description,
        status: optimistic.status,
        priority: optimistic.priority,
        expected_deadline: optimistic.expected_deadline?.slice(0, 10) ?? undefined,
        submission_status: optimistic.submission_status ?? undefined,
        approval_date: optimistic.approval_date?.slice(0, 10) ?? undefined,
        stage_notes: optimistic.stage_notes ?? undefined,
      });

      setLocalTasks((prev) =>
        prev.map((t) => (t.id === tempId ? { ...optimistic, id: created.id } : t))
      );
    } catch (err) {
      console.error("Failed to create task:", err);
      setLocalTasks((prev) => prev.filter((t) => t.id !== tempId));
    }
  };

  const handleDeleteTask = async (id: string) => {
    const prev = [...localTasks];
    setLocalTasks((p) => p.filter((t) => t.id !== id));
    try {
      await deleteTask.mutateAsync(id);
    } catch {
      setLocalTasks(prev);
    }
  };

  /* ---------------- SEQUENTIAL QUEUED UPDATES (NO SKIPPING, CORRECT PAYLOAD) ---------------- */

  const updateQueues = React.useRef<Map<string, Promise<void>>>(new Map());

  const patchTaskDebounced = async (
    id: string,
    incomingPatch: Partial<TaskUI> & { dependencies?: string[]; audit_entries?: any[] }
  ): Promise<void> => {
    const prevPromise = updateQueues.current.get(id) || Promise.resolve();

    const currentPromise = prevPromise.then(async () => {
      const toSend: Array<{ taskId: string; input: any }> = [];

      setLocalTasks((prev) => {
        const next = prev.map((t) => ({ ...t }));
        const self = next.find((t) => t.id === id);
        if (!self) return prev;

        const before = { start: self.start, end: self.end, deps: [...(self.dependencies || [])] };

        if (incomingPatch.start !== undefined) self.start = incomingPatch.start ?? null;
        if (incomingPatch.end !== undefined) self.end = incomingPatch.end ?? null;
        if (incomingPatch.hours !== undefined) self.hours = incomingPatch.hours;

        if (incomingPatch.name != null) self.name = incomingPatch.name;
        if (incomingPatch.progress !== undefined) self.progress = incomingPatch.progress;
        if (incomingPatch.parentId !== undefined) self.parentId = incomingPatch.parentId ?? null;
        if (incomingPatch.position !== undefined) self.position = incomingPatch.position;
        if (incomingPatch.dependencies !== undefined)
          self.dependencies = normalizeDeps(incomingPatch.dependencies, self.id);

        if ((incomingPatch as any).assignees !== undefined)
          (self as any).assignees = (incomingPatch as any).assignees;
        if ((incomingPatch as any).allocations !== undefined)
          (self as any).allocations = (incomingPatch as any).allocations;

        if (incomingPatch.description !== undefined)
          (self as any).description = incomingPatch.description;
        if (incomingPatch.status !== undefined) (self as any).status = incomingPatch.status;
        if (incomingPatch.priority !== undefined) (self as any).priority = incomingPatch.priority;

        if (incomingPatch.expected_deadline !== undefined) self.expected_deadline = incomingPatch.expected_deadline;
        if (incomingPatch.submission_status !== undefined) self.submission_status = incomingPatch.submission_status;
        if (incomingPatch.approval_date !== undefined) self.approval_date = incomingPatch.approval_date;
        if (incomingPatch.stage_notes !== undefined) self.stage_notes = incomingPatch.stage_notes;

        if (self.start && self.end && new Date(self.end) < new Date(self.start)) {
          self.end = new Date(self.start).toISOString();
        }

        if (incomingPatch.dependencies !== undefined) {
          adjustTaskForOwnDependencies(self, next);
        }

        const selfMoved = self.start !== before.start || self.end !== before.end;
        if (selfMoved) {
          cascadeFrom(self.id, next).forEach((depId) => {
            const dep = next.find((t) => t.id === depId)!;
            const depPatch = buildMappedPatch({ start: dep.start, end: dep.end });
            if (Object.keys(depPatch).length > 0) {
              toSend.push({ taskId: dep.id, input: depPatch });
            }
          });
        }

        const selfPatch = buildMappedPatch(incomingPatch);
        const finalInput = incomingPatch.audit_entries ? { ...selfPatch, audit_entries: incomingPatch.audit_entries } : selfPatch;

        if (Object.keys(selfPatch).length > 0) {
          toSend.push({ taskId: id, input: finalInput });
        }

        if ((incomingPatch as any).audit_history !== undefined) {
          (self as any).audit_history = (incomingPatch as any).audit_history;
        }

        return next;
      });

      for (const { taskId, input } of toSend) {
        try {
          await updateTask.mutateAsync({ taskId, input });
        } catch (err) {
          console.error(`Failed to update task ${taskId}:`, err);
        }
      }
    }).finally(() => {
      if (updateQueues.current.get(id) === currentPromise) {
        updateQueues.current.delete(id);
      }
    });

    updateQueues.current.set(id, currentPromise);
    return currentPromise;
  };

  const flushTaskDebounce = () => {};

  return (
    <GlobalContext.Provider
      value={{
        projectId: projectId!,
        tasks,
        handleAddTask,
        handleDeleteTask,
        patchTaskDebounced,
        flushTaskDebounce,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalStateProvider;