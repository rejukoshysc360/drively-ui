// src/features/timesheets/components/TaskSelector.tsx
import ModernTaskSelect from "../../../components/ui/ModernTaskSelect";
import {
  useAssignments,
  useHRProjectAssignments,
} from "../../../features/projects/hooks";

export default function TaskSelector({
  projectId,
  taskId,
  isEditable,
  employeeId, // ✅ optional, used by HR
  onChange,
}: {
  projectId: string | null;
  taskId: string | null;
  isEditable: boolean;
  employeeId?: string;
  onChange: (v: string) => void;
}) {
  // ✅ Use the right hook depending on context
  const { data: tasks, isLoading } = employeeId
    ? useHRProjectAssignments(projectId || "", employeeId)
    : useAssignments(projectId || "");

  if (!projectId) {
    return (
      <ModernTaskSelect
        value="select"
        onChange={() => {}}
        tasks={[]}
        disabled
      />
    );
  }

  if (isLoading) {
    return (
      <div className="text-gray-400 text-sm italic px-2">
        Loading tasks…
      </div>
    );
  }

  const taskList =
    (tasks || []).map((t: any) => ({
      id: t.id,
      name: t.task_path ? t.task_path : t.name || "Unnamed Task",
      parent_id: t.parent_id || null,
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
