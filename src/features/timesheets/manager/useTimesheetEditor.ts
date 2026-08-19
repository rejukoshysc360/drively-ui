import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useAuth } from "../../auth/AuthProvider";
import {
  useUpdateTimesheetWithEntries,
  useDeleteTimesheetEntry,
  useTimesheetsByEmployeeAndMonth,
  useEmployeeAssignments,
} from "../hooks";

dayjs.extend(isBetween);

/* ------------------------------------------------------------------
   ✅ HR-only Timesheet Editor Hook
   - Mirrors employee version’s duplicate handling
   - Deep-clone safe updates
   - Unified save via updateTimesheetWithEntries
------------------------------------------------------------------ */
export function useTimesheetEditor(from: string, to: string, employeeId: string) {

  const { organization_id, organization_country_code } = useAuth();
  const qc = useQueryClient();

  /* ----------------------------------
     🔹 Data source
  ---------------------------------- */
  const { data, isLoading } = useTimesheetsByEmployeeAndMonth(
    employeeId,
    dayjs(from).year(),
    dayjs(from).month() + 1
  );

  /* ----------------------------------
     🔹 Assignments (projects & tasks)
  ---------------------------------- */
  const { data: assignments } = useEmployeeAssignments(employeeId);

const availableProjects = useMemo(() => {
  if (!assignments?.length) return [];

  const map: Record<string, any> = {};

  // recursive flattener for nested subtasks
  const collectDescendants = (task: any, allTasks: any[]): any[] => {
    const descendants = allTasks.filter((t) => t.parent_id === task.id);
    let result = [...descendants];
    for (const d of descendants) {
      result = result.concat(collectDescendants(d, allTasks));
    }
    return result;
  };

  for (const a of assignments) {
    if (!a.project_id) continue;

    // initialize project container
    if (!map[a.project_id]) {
      map[a.project_id] = {
        id: a.project_id,
        name: a.project_name || a.project?.name || "Unnamed Project",
        tasks: [],
      };
    }

    // full task list for this project (parent + descendants)
    const projectTasks = a.project_tasks || [];

    // find the assigned task
    const assignedTask = projectTasks.find((t: any) => t.id === a.task_id);
    if (assignedTask) {
      // push the parent task
      map[a.project_id].tasks.push({
        id: assignedTask.id,
        name: assignedTask.name || "Untitled Task",
        parent_id: assignedTask.parent_id || null,
      });

      // recursively collect *all* levels of subtasks
      const descendants = collectDescendants(assignedTask, projectTasks);
      for (const d of descendants) {
        if (!map[a.project_id].tasks.some((x: any) => x.id === d.id)) {
          map[a.project_id].tasks.push({
            id: d.id,
            name: d.name || "Untitled Task",
            parent_id: d.parent_id || null,
          });
        }
      }
    }
  }

  // always append “Others” option for UX
  for (const project of Object.values(map)) {
    const hasOthers = project.tasks.some(
      (t: any) => t.name.toLowerCase() === "others"
    );
    if (!hasOthers) {
      project.tasks.push({ id: "others", name: "Others" });
    }
  }

  return Object.values(map);
}, [assignments]);


  /* ----------------------------------
     🔹 Local state
  ---------------------------------- */
  const [entries, setEntries] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    description: "",
    confirmLabel: "OK",
    onConfirm: () => setDialog((d) => ({ ...d, open: false })),
  });

  useEffect(() => {
    if (!data) return;
    const filtered = Array.isArray(data)
      ? data.filter((d: any) => dayjs(d.date).isBetween(from, to, "day", "[]"))
      : [];
    setEntries(filtered);
  }, [data, from, to]);

  /* ----------------------------------
     🔹 Mutations
  ---------------------------------- */
  const updateTimesheet = useUpdateTimesheetWithEntries();
  const deleteEntry = useDeleteTimesheetEntry();

  /* ----------------------------------
     🔹 Row helpers
  ---------------------------------- */
  const addRow = (i: number) => {
    setEntries((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const day = copy[i];
      if (!day?.entries) day.entries = [];
      day.entries.push({
        project_id: "",
        task_id: "",
        hours: 0,
        activity: "",
        isNew: true,
      });
      return copy;
    });
  };

  const removeRow = async (i: number, j: number) => {
    const current = JSON.parse(JSON.stringify(entries));
    const entry = current[i]?.entries?.[j];
    if (!entry) return;

    current[i].entries.splice(j, 1);
    setEntries(current);

    if (entry?.id && current[i]?.id) {
      await deleteEntry.mutateAsync({
        timesheetId: current[i].id,
        entryId: entry.id,
      });
    }
  };

  const updateRow = (i: number, j: number, field: string, value: any) => {
    setEntries((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (copy[i]?.entries?.[j]) {
        copy[i].entries[j][field] = value;
      }
      return copy;
    });
  };

  const openDialog = (title: string, description: string) => {
    setDialog({
      open: true,
      title,
      description,
      confirmLabel: "OK",
      onConfirm: () => setDialog((d) => ({ ...d, open: false })),
    });
  };

  /* ----------------------------------
     🔹 Save logic (HR-only)
  ---------------------------------- */
  const save = async (
    status: "draft" | "submitted" = "submitted",
    onClose?: () => void
  ) => {
    if (!entries.length) return;

    const previousEntries = JSON.parse(JSON.stringify(entries));
    setIsSaving(true);

    try {
      const editableDays = entries.filter((e) => e.entries?.length);

     
// 🧩 VALIDATIONS — Only enforce for UAE
      if (organization_country_code === "AE") {
        const overLimitDays = editableDays.filter((e) => {
          const total = e.entries.reduce(
            (sum: number, x: any) => sum + (Number(x.hours) || 0),
            0
          );
          return total > 9;
        });

        if (overLimitDays.length > 0) {
          openDialog(
            "Daily Limit Exceeded",
            `You’ve logged more than 9 hours on: ${overLimitDays
              .map((d) => d.date)
              .join(", ")}.`
          );
          setEntries(previousEntries);
          setIsSaving(false);
          return;
        }
      }

      const zeroHourDays = editableDays.filter((d) =>
        d.entries.some((e: any) => !e.hours || e.hours <= 0)
      );
      if (zeroHourDays.length > 0) {
        openDialog(
          "Invalid Duration",
          `Some entries have 0 or missing hours on: ${zeroHourDays
            .map((d) => d.date)
            .join(", ")}.`
        );
        setEntries(previousEntries);
        setIsSaving(false);
        return;
      }

      const invalidDays = editableDays.filter((d) =>
        d.entries.some(
          (e: any) => !e.task_id || e.task_id === "select" || e.task_id === ""
        )
      );
      if (invalidDays.length > 0) {
        openDialog(
          "Please Select a Task",
          `Please select valid tasks for: ${invalidDays
            .map((d) => d.date)
            .join(", ")}.`
        );
        setEntries(previousEntries);
        setIsSaving(false);
        return;
      }

      const missingActivity = editableDays.filter((d) =>
        d.entries.some(
          (e: any) => !e.activity || e.activity.trim().length === 0
        )
      );
      if (missingActivity.length > 0) {
        openDialog(
          "Missing Activity Note",
          `Please add activity notes for: ${missingActivity
            .map((d) => d.date)
            .join(", ")}.`
        );
        setEntries(previousEntries);
        setIsSaving(false);
        return;
      }

      // ✅ Proceed with backend updates
      for (const day of editableDays) {
        const total_hours = day.entries.reduce(
          (sum: number, e: any) => sum + (Number(e.hours) || 0),
          0
        );

        const response = await updateTimesheet.mutateAsync({
          id: day.id,
          total_hours,
          status,
          entries: day.entries.map((e: any) => ({
            id: e.id,
            project_id: e.project_id,
           task_id:
            !e.task_id || e.task_id === "others" || e.task_id === "NULL"
              ? null
              : e.task_id, // ✅ normalize invalid values
            hours: e.hours,
            activity: e.activity,
            notes: e.notes,
          })),
        });

        // 🧩 Mirror employee logic: handle success with message
        if (response?.message === "DUPLICATE_TASK_ENTRY") {
          openDialog(
            "Save Failed",
            "You’ve added the same project/task combination more than once for the same day. Each task must be unique."
          );
          setEntries(previousEntries);
          setIsSaving(false);
          return;
        }
      }

      qc.invalidateQueries({
        queryKey: ["timesheets", organization_id, "employee", employeeId],
      });

      openDialog(
        status === "draft" ? "Saved as Draft" : "Submitted Successfully",
        status === "draft"
          ? "Your draft entries have been saved."
          : "The timesheet has been submitted for review."
      );

      onClose?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (typeof err === "string"
          ? err
          : "An error occurred while saving.");

      let message = msg;
      if (
        msg.includes("DUPLICATE_TASK_ENTRY") ||
        msg.includes("timesheet_tasks_unique")
      ) {
        message =
          "You’ve added the same project/task combination more than once for the same day. Each task must be unique.";
      }

      openDialog("Save Failed", message);
      setEntries(previousEntries);
    } finally {
      setIsSaving(false);
    }
  };

  /* ----------------------------------
     🔹 Return values
  ---------------------------------- */
  return {
    entries,
    addRow,
    removeRow,
    updateRow,
    save,
    isSaving,
    isLoading,
    availableProjects,
    dialog,
    setDialog,
  };
}
