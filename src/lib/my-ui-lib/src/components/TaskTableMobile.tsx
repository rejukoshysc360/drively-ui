import React, { useContext } from "react";
import { Plus } from "lucide-react";
import TaskRow from "./TaskRow";
import { flattenHierarchy } from "./utils";
import CustomSlider from "./CustomSlider";
import { FrappeGantt } from "frappe-gantt-react";
import TaskProgressOverlay from "./TaskProgressOverlay";
import { GlobalContext } from "../state/Contexts/GlobalStateProvider";
import { useCan } from "../../../../utils/permissions";

type TaskTableMobileProps = {
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
  chartTasks: any[];
  groupCss: string;
  viewMode: "Day" | "Week" | "Month";
  setViewMode: (mode: "Day" | "Week" | "Month") => void;
  patchTaskDebounced: (id: string, patch: Partial<any>) => void;
  onProtectedDelete: (task: any) => void;
};

const TaskTableMobile: React.FC<TaskTableMobileProps> = ({
  tasks,
  visibleTasks,
  collapsed,
  toggleCollapse,
  patchTask,
  addSubtask,
  setDrawerTask,
  setDetailsTask,
  handleAddTask,
  chartTasks,
  groupCss,
  viewMode,
  setViewMode,
  patchTaskDebounced,
  onProtectedDelete,
}) => {
  const [showChart, setShowChart] = React.useState(false);
  const [progressTask, setProgressTask] = React.useState<any>(null);
  const [isAdding, setIsAdding] = React.useState(false); // ✅ new state

  const globalCTX = useContext(GlobalContext);
  const can = useCan();
  const projectId = globalCTX?.projectId;

  const handleAddNewTask = async () => {
    try {
      setIsAdding(true);
      await handleAddTask({
        name: "New Task",
        start: new Date().toISOString(),
        end: new Date(Date.now() + 3 * 86400000).toISOString(),
        progress: 0,
        parentId: null,
        hours: 0,
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="sm:hidden flex flex-col gap-5 w-full max-w-none px-0">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-900">Tasks</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowChart(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition"
          >
            Gantt
          </button>

          {can("tasks:create") && (
            <button
              onClick={handleAddNewTask}
              disabled={isAdding}
              className={`inline-flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium shadow-sm transition
                ${
                  isAdding
                    ? "bg-indigo-400 cursor-not-allowed text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
            >
              {isAdding ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                  Adding...
                </span>
              ) : (
                <>
                  <Plus size={16} strokeWidth={2} /> Add Task
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
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
            onOpenAssign={(t) => setDrawerTask(t)}
            onOpenDetails={(t) => setDetailsTask(t)}
            onRequestDelete={onProtectedDelete}
            onOpenProgress={(t) =>
              setProgressTask({ ...t, project_id: t.project_id ?? projectId })
            }
          />
        );
      })}

      {/* Gantt Chart Overlay */}
      {showChart && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white w-full h-full flex flex-col rounded-t-2xl">
            <div className="p-5 flex justify-between items-center border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Gantt Chart</h3>
              <button
                onClick={() => setShowChart(false)}
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm font-medium"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-x-auto p-5">
              {chartTasks.length ? (
                <>
                  <CustomSlider viewMode={viewMode} setViewMode={setViewMode} />
                  <style dangerouslySetInnerHTML={{ __html: groupCss }} />
                  <div className="min-w-[800px]">
                    <FrappeGantt
                      tasks={chartTasks}
                      viewMode={viewMode}
                      onClick={() => {}}
                      onDateChange={(gTask, start, end) => {
                        const local = tasks.find((t) => t.id === gTask.id);
                        const deps: string[] = local?.dependencies || [];
                        patchTaskDebounced(gTask.id, {
                          start: start.toISOString(),
                          end: end.toISOString(),
                          dependencies: deps,
                        });
                      }}
                      onProgressChange={(gTask, progress) =>
                        patchTaskDebounced(gTask.id, { progress })
                      }
                    />
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center text-lg">
                - No chart is available. A chart will be displayed only when the task has defined start and end dates.-
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Progress Overlay */}
      {progressTask && (
        <TaskProgressOverlay
          task={progressTask}
          onClose={() => setProgressTask(null)}
        />
      )}
    </div>
  );
};

export default TaskTableMobile;
