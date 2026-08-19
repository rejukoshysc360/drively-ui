import React, { useContext } from "react";
import { Plus, Maximize2, Minimize2, Info } from "lucide-react";
import TaskRow from "./TaskRow";
import { flattenHierarchy } from "./utils";
import { useCan } from "../../../../utils/permissions";
import TaskProgressOverlay from "./TaskProgressOverlay";
import { GlobalContext } from "../state/Contexts/GlobalStateProvider";

type TaskTableProps = {
  tasks: any[];
  visibleTasks: any[];
  collapsed: Set<string>;
  toggleCollapse: (id: string) => void;
  patchTask: (id: string, patch: Partial<any>) => void;
  addSubtask: (parentId: string) => void;
  setDrawerTask: (task: any) => void;
  setDetailsTask: (task: any) => void;
  setDeleteTarget: (task: any) => void;
  handleAddTask: (task: any, insertIndex?: number) => void;
  colTemplate: string;
  onProtectedDelete: (task: any) => void;
};

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  visibleTasks,
  collapsed,
  toggleCollapse,
  patchTask,
  addSubtask,
  setDrawerTask,
  setDetailsTask,
  handleAddTask,
  colTemplate,
  onProtectedDelete,
}) => {
  const [zoomed, setZoomed] = React.useState(false);
  const [progressTask, setProgressTask] = React.useState<any>(null);

  const globalCTX = useContext(GlobalContext);
  const can = useCan();
  const projectId = globalCTX?.projectId;

  const fixedColTemplate =
    "grid-cols-[3fr_0.8fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_2fr_1fr]";

  const handleAddNewTask = () => {
    handleAddTask({
      name: "New Task",
      start: null,
      end: null,
      progress: 0,
      parentId: null,
      hours: null,
    });
  };

  const renderHeader = () => (
    <div
      role="row"
      className={`grid ${fixedColTemplate} items-center px-4 py-3 gap-3
        bg-gray-100 text-gray-500 uppercase text-xs font-bold
        tracking-wide border-b border-gray-200`}
    >
<div className="flex items-center gap-2 sticky left-0 z-[60] bg-gray-100">
        <span className="w-6" />
        <span className="w-6" />
        <span>Title</span>
      </div>
      <div className="text-center">Details</div>
      <div className="text-center">Start</div>
      <div className="text-center">End</div>
      <div className="text-center">Hours</div>
      <div className="text-center">Expected Deadline</div>
      <div className="text-center">Submission Status</div>
      <div className="text-center">Priority</div>
      <div className="text-center">Approval Date</div>
      <div className="text-center">Depends On</div>
      <div className="text-center">Audits</div>
      <div className="text-center">Progress</div>
      <div className="text-center">Assignee</div>
      <div className="text-center">Actions</div>
    </div>
  );

  const renderTable = () => (
    <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm relative">
      {/* Unified scroll region */}
      <div className="max-h-[85vh] overflow-y-auto overflow-x-auto relative">
        <div className="min-w-max">
          {/* Single Sticky Header */}
          <div className="sticky top-0 z-[50] bg-white border-b border-gray-300 shadow-sm">
            {renderHeader()}
          </div>

          {/* Data Rows */}
          {visibleTasks.map((task) => {
            const level =
              flattenHierarchy(tasks).find((x) => x.id === task.id)?._level || 0;
            const children = tasks.filter((x) => x.parentId === task.id);

            return (
              <TaskRow
                key={task.id}
                task={task}
                level={level}
                tasks={tasks}
                onPatch={patchTask}
                onAddSubtask={addSubtask}
                toggleCollapse={toggleCollapse}
                hasChildren={children.length > 0}
                isCollapsed={collapsed.has(task.id)}
                onOpenAssign={setDrawerTask}
                onOpenDetails={setDetailsTask}
                onRequestDelete={onProtectedDelete}
                onOpenProgress={(t) =>
                  setProgressTask({
                    ...t,
                    project_id: t.project_id ?? projectId,
                  })
                }
                colTemplate={fixedColTemplate}
              />
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-5 bg-white flex flex-col">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-xl font-bold text-gray-900">Tasks</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setZoomed((z) => !z)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-200 transition"
          >
            {zoomed ? (
              <>
                <Minimize2 size={16} /> Unzoom
              </>
            ) : (
              <>
                <Maximize2 size={16} /> Zoom
              </>
            )}
          </button>

          {can("tasks:create") && (
            <button
              onClick={handleAddNewTask}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-md hover:bg-indigo-700 transition"
            >
              <Plus size={16} /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Main table */}
      {renderTable()}

      {/* Zoomed full-screen view */}
      {zoomed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full h-full rounded-lg shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-xl font-bold">Tasks</h3>
              <div className="flex gap-2">
                {can("tasks:create") && (
                  <button
                    onClick={handleAddNewTask}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-md hover:bg-indigo-700 transition"
                  >
                    <Plus size={16} /> Add Task
                  </button>
                )}
                <button
                  onClick={() => setZoomed(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition"
                >
                  <Minimize2 size={16} /> Close
                </button>
              </div>
            </div>

            <div className="flex-1 p-5">{renderTable()}</div>
          </div>
        </div>
      )}

      {progressTask && (
        <TaskProgressOverlay task={progressTask} onClose={() => setProgressTask(null)} />
      )}
    </div>
  );
};

export default TaskTable;
