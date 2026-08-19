import { X, PlusCircle, Trash2 } from "lucide-react";
import { useTimesheetEditor } from "./useTimesheetEditor";
import ModernDurationSelect from "../../../components/ui/ModernDurationSelect";
import ModernProjectSelect from "../../../components/ui/ModernProjectSelect";
import ModernTaskSelect from "../../../components/ui/ModernTaskSelect";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useAssignments, useHRProjectAssignments } from "../../../features/projects/hooks";
import { useAuth } from "../../../features/auth/AuthProvider";

export default function SingleDayTimesheetEditor({ date, employeeId, onClose }: any) {
  const {
    entries,
    addRow,
    updateRow,
    removeRow,
    save,
    isSaving,
    isLoading,
    availableProjects,
    dialog,
    setDialog,
  } = useTimesheetEditor(date, date, employeeId);

  const { organization_id, profile } = useAuth();

  // ✅ Detect privileged roles (admin, hr, manager)
  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
    ? [profile.roles]
    : [];
  const loggedInSlugs = roles.map((r: any) => r.slug?.toLowerCase?.());
  const isPrivilegedUser = ["hr", "manager"].some((r) =>
    loggedInSlugs.includes(r)
  );

  const day = entries[0];

  return (
    <div className="space-y-5">
      {/* Loading */}
      {isLoading && (
        <div className="text-gray-500 text-sm italic">Loading timesheet...</div>
      )}

      {!isLoading && (
        <>
          {day?.entries?.length === 0 && (
            <div className="text-sm text-gray-500 italic mb-2">
              No entries yet. Click “Add Task Entry” to start.
            </div>
          )}

          <div className="space-y-3">
            {day?.entries?.map((entry, j) => (
              <div
                key={j}
                className="flex flex-wrap md:flex-nowrap items-center gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition"
              >
                {/* ⏱ Duration */}
                <ModernDurationSelect
                  value={entry.hours || 0}
                  onChange={(v) => updateRow(0, j, "hours", v)}
                />

                {/* 🏗 Project */}
                <ModernProjectSelect
                  value={entry.project_id || ""}
                  onChange={(v) => {
                    updateRow(0, j, "project_id", v);
                    updateRow(0, j, "task_id", "");
                  }}
                  projects={availableProjects || []}
                />

                {/* 🧩 Task */}
                <TaskSelector
                  projectId={entry.project_id || null}
                  taskId={entry.task_id || ""}
                  employeeId={employeeId}
                  isEditable={!!entry.project_id}
                  isPrivilegedUser={isPrivilegedUser} // ✅ Pass down
                  onChange={(v) => updateRow(0, j, "task_id", v)}
                />

                {/* 📝 Activity */}
                <input
                  type="text"
                  value={entry.activity || ""}
                  onChange={(e) => updateRow(0, j, "activity", e.target.value)}
                  placeholder="Describe activity..."
                  className="border rounded-md px-2 py-1 text-sm flex-1 focus:border-indigo-500 focus:ring-indigo-500"
                />

                {/* 🗑 Remove */}
                <button
                  onClick={() => removeRow(0, j)}
                  className="text-gray-500 hover:text-red-600 transition"
                  title="Remove entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {/* ➕ Add Entry */}
            <button
              onClick={() => addRow(0)}
              className="flex items-center gap-1 text-sm text-indigo-600 font-medium hover:text-indigo-800"
            >
              <PlusCircle size={15} /> Add Task Entry
            </button>
          </div>

          {/* Summary Footer */}
          {day && (
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                Total Hours:{" "}
                <span className="font-semibold text-blue-700">
                  {day.total_hours?.toFixed(1) ?? "0.0"}h
                </span>
              </span>

              <button
                onClick={() => save("submitted", onClose)}
                disabled={isSaving}
                className={`px-5 py-2 rounded-md text-sm text-white transition ${
                  isSaving
                    ? "bg-green-400 cursor-wait"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        description={dialog.description}
        confirmLabel={dialog.confirmLabel || "OK"}
        onConfirm={dialog.onConfirm}
        onClose={() => setDialog({ ...dialog, open: false })}
      />
    </div>
  );
}

/* 🧩 TaskSelector — now respects privileged role override */
function TaskSelector({
  projectId,
  taskId,
  isEditable,
  employeeId,
  isPrivilegedUser,
  onChange,
}: {
  projectId: string | null;
  taskId: string | null;
  isEditable: boolean;
  employeeId?: string;
  isPrivilegedUser?: boolean;
  onChange: (v: string) => void;
}) {
  // ✅ Use the correct hook that passes employeeId
  const { data: tasks, isLoading } = useHRProjectAssignments(projectId || "", employeeId);

  if (!projectId) {
    return <ModernTaskSelect value="" onChange={() => {}} tasks={[]} disabled />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm italic px-2">
        <svg className="animate-spin h-4 w-4 text-indigo-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading tasks…
      </div>
    );
  }

  // ✅ Privileged users see all tasks enabled
  const taskList =
    (tasks || []).map((t: any) => ({
      id: t.id,
      name: t.name || "Unnamed Task",
      parent_id: t.parent_id || null,
      is_assigned: isPrivilegedUser ? true : t.is_assigned || false,
    })) || [];

  return (
    <ModernTaskSelect
      value={taskId || ""}
      onChange={onChange}
      tasks={taskList}
      disabled={!isEditable}
    />
  );
}
