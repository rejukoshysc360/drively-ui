import React from "react";
import dayjs from "dayjs";
import debounce from "lodash/debounce";
import AsyncSelect from "react-select/async";
import { GlobalContext } from "../../lib/my-ui-lib/src/state/Contexts/GlobalStateProvider";
import { APP_CONFIG } from "../../../src/config/appConfig";
import { employeesApi } from "../../features/employees/api";
import TaskCommentsSection from "./TaskCommentsSection";

type Props = {
  task: any;
  onClose: () => void;
  onPatch?: (id: string, patch: Partial<any>) => void;
  readOnlyDescription?: boolean;
  readOnlyPriority?: boolean;
};

const TaskDetailsDrawer: React.FC<Props> = ({
  task,
  onClose,
  onPatch,
  readOnlyDescription = false,
  readOnlyPriority = false,
}) => {
  const ctx = React.useContext(GlobalContext);

  const patchTask =
    onPatch ??
    (ctx
      ? ctx.patchTaskDebounced
      : () => console.warn("No patchTask available for TaskDetailsDrawer"));

  const [description, setDescription] = React.useState(task.description || "");
  const [status, setStatus] = React.useState(task.status || "todo");
  const [priority, setPriority] = React.useState(task.priority || "medium");

  const [projectLead, setProjectLead] = React.useState<any>(task.project_lead || null);
  const [bmLead, setBmLead] = React.useState<any>(task.bm_lead || null);
  const [reviewer, setReviewer] = React.useState<any>(task.reviewer || null);

  React.useEffect(() => {
    setDescription(task.description || "");
    setStatus(task.status || "todo");
    setPriority(task.priority || "medium");
    setProjectLead(task.project_lead || null);
    setBmLead(task.bm_lead || null);
    setReviewer(task.reviewer || null);
  }, [task]);

  // ✅ Employee search loader (exactly like employment tab)
  const loadEmployeeOptions = React.useCallback(
    debounce(
      async (inputValue: string): Promise<{ value: string; label: string }[]> => {
        if (!ctx?.organization_id) return [];
        try {
          const res = await employeesApi.list(ctx.organization_id, 1, 10, inputValue);
          return res.employees.map((e: any) => ({
            value: e.id,
            label: `${e.full_name} (${e.email})`,
          }));
        } catch (err) {
          console.error("Employee search failed", err);
          return [];
        }
      },
      300
    ),
    [ctx?.organization_id]
  );

  const save = () => {
    patchTask(task.id, {
      description,
      status,
      priority,
      project_lead: projectLead?.value || null,
      bm_lead: bmLead?.value || null,
      reviewer: reviewer?.value || null,
    });
    onClose();
  };

  const start = task.start ? dayjs(task.start) : null;
  const end = task.end ? dayjs(task.end) : null;
  const duration =
    start && end ? end.diff(start, "day") + 1 : task.duration ?? null;

  const isMainTask = !task.parentId;
  const statusOptions = isMainTask
    ? APP_CONFIG.STATUS_OPTIONS_MAIN
    : APP_CONFIG.STATUS_OPTIONS_SUB;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white shadow-xl z-50 flex flex-col">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-semibold text-base sm:text-lg">Task Details</h3>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 text-lg sm:text-xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Task name, description, etc. */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Task</div>
            <div className="font-medium text-base sm:text-sm">{task?.name}</div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border rounded px-2 py-2 text-sm"
              disabled={readOnlyDescription}
            />
          </div>

          {/* ✅ Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded px-2 py-2 text-sm"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border rounded px-2 py-2 text-sm"
              disabled={readOnlyPriority}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div> 
          <TaskCommentsSection task={task} projectId={ctx?.projectId!} />
        </div>

        <div className="mt-auto px-4 py-3 border-t flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded bg-gray-100 text-sm font-medium"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded bg-indigo-600 text-white text-sm font-medium"
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
};

export default TaskDetailsDrawer;
