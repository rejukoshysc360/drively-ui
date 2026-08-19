import React, { useContext, useMemo } from "react";
import Split from "react-split";
import { GlobalContext } from "../state/Contexts/GlobalStateProvider";
import CustomSlider from "./CustomSlider";
import AssigneeDrawer from "../../../../features/tasks/AssigneeDrawer";
import TaskDetailsDrawer from "../../../../features/tasks/TaskDetailsDrawer";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import { FrappeGantt } from "frappe-gantt-react";
import { flattenHierarchy, getRootId, idMap } from "./utils";
import TaskTable from "./TaskTable";
import TaskTableMobile from "./TaskTableMobile";
import { useProject } from "../../../../features/projects/hooks";
import { useParams } from "react-router-dom";


const COL_TEMPLATE =
  "grid-cols-[minmax(16rem,1fr)_8rem_10rem_10rem_6rem_minmax(8rem,0.1fr)_minmax(10rem,0.1fr)_10rem]";

const Chart: React.FC = () => {
  const globalCTX = useContext(GlobalContext);
  if (!globalCTX) return null;

  const { tasks, handleAddTask, handleDeleteTask, patchTaskDebounced } = globalCTX;

  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<"Day" | "Week" | "Month">("Day");
  const [drawerTask, setDrawerTask] = React.useState<any | null>(null);
  const [detailsTask, setDetailsTask] = React.useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);
  const [blockedDeleteTask, setBlockedDeleteTask] = React.useState<any | null>(null);
  const { projectId } = useParams();
   const { data: project } = useProject(projectId!);

  const toggleCollapse = (taskId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const visibleTasks = useMemo(() => {
    const map = idMap(tasks);
    return tasks.filter((t) => {
      let cur = t.parentId;
      while (cur) {
        if (collapsed.has(cur)) return false;
        cur = map.get(cur)?.parentId;
      }
      return true;
    });
  }, [tasks, collapsed]);

  const patchTask = (id: string, patch: Partial<any>) => patchTaskDebounced(id, patch);
  const removeTaskById = (id: string) => handleDeleteTask(id);

  const addSubtask = (parentId: string) => {
    const parentIndex = tasks.findIndex((t) => t.id === parentId);
    if (parentIndex === -1) return;
    let insertIndex = parentIndex + 1;
    let lastPos = tasks[parentIndex].position ?? (parentIndex + 1) * 1000;

    const parentMap = new Map(tasks.map((t) => [t.id, t.parentId ?? null]));
    const isDescendant = (candidate: string, ancestor: string) => {
      let current = parentMap.get(candidate);
      while (current) {
        if (current === ancestor) return true;
        current = parentMap.get(current) ?? null;
      }
      return false;
    };

    for (let i = parentIndex + 1; i < tasks.length; i++) {
      if (isDescendant(tasks[i].id, parentId)) {
        insertIndex = i + 1;
        lastPos = tasks[i].position ?? lastPos + 1;
      } else break;
    }

    handleAddTask(
      {
        name: "New Subtask",
        start: null,
        end: null,
        parentId,
        progress: 0,
        position: lastPos + 1,
      },
      insertIndex
    );
  };

  /* ---------------------------
   * ✅ Unified Delete Protection
   * -------------------------- */
  const handleProtectedDelete = (task: any) => {
    const isUsedAsDependency = tasks.some(
      (t) => Array.isArray(t.dependencies) && t.dependencies.includes(task.id)
    );
    const hasChildren = tasks.some((t) => t.parentId === task.id);

    if (isUsedAsDependency) {
      setBlockedDeleteTask({ task, reason: "DEPENDENCY" });
    } else if (hasChildren) {
      setBlockedDeleteTask({ task, reason: "CHILDREN" });
    } else {
      setDeleteTarget(task);
    }
  };

  /* --- Gantt data + CSS --- */
  const { chartTasks, groupCss } = useMemo(() => {
    if (!tasks.length) return { chartTasks: [], groupCss: "" };

    const ordered = flattenHierarchy(tasks).filter((t) => t.start && t.end);
    const groupIndex = new Map<string, number>();
    const palette = [
      "#4F46E5", "#06B6D4", "#22C55E", "#F59E0B",
      "#EF4444", "#A855F7", "#14B8A6", "#3B82F6",
    ];

    let idx = 0;
    const ct = ordered.map((t) => {
      const rootId = getRootId(ordered, t);
      if (!groupIndex.has(rootId)) groupIndex.set(rootId, idx++);
      const tag = `grp-${groupIndex.get(rootId)}`;
      return {
        id: t.id,
        name: `${"  ".repeat(t._level)}↳ ${t.name}`,
        start: t.start,
        end: t.end,
        progress: t.progress,
        dependencies: (t.dependencies || []).join(","),
        custom_class: `${tag}${t._level > 0 ? " child" : ""}`,
      };
    });

    const css =
      Array.from(groupIndex.values())
        .map((i) => {
          const color = palette[i % palette.length];
          return `
.gantt .bar-wrapper.${i} { transition: all 0.3s ease; }
.gantt .bar.${i} .bar-rect { fill: ${color}20; stroke: ${color}; stroke-width: 1; }
.gantt .bar.${i} .bar-progress { fill: ${color}; }
.gantt .bar.${i} .bar-label { fill: ${color}; font-weight: 500; font-size: 12px; }
.gantt .bar.${i}:hover .bar-rect { fill: ${color}40; }`;
        })
        .join("\n") +
      `.gantt .bar.child .bar-label { font-style: italic; opacity: 0.9; font-size: 11px; }
.gantt .grid-row { background-color: #f9fafb; }
.gantt .grid-header { background-color: #f3f4f6; font-weight: 600; }
.gantt .arrow { stroke: #6b7280; stroke-width: 1.5; }`;

    return { chartTasks: ct, groupCss: css };
  }, [tasks]);

  return (
    <div className="w-full h-full bg-gray-50">
      {/* Desktop split */}
      <div className="hidden sm:flex  h-[calc(100vh-180px)] border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
        <Split
          className="flex h-full w-full"
          sizes={[35, 65]}
          minSize={300}
          gutterSize={8}
          gutter={(index, direction) => {
            const gutter = document.createElement("div");
            gutter.className =
              "gutter flex items-center justify-center bg-gray-200 hover:bg-gray-300 transition-colors cursor-col-resize";
            gutter.innerHTML = `
              <div class="flex flex-col gap-1">
                <span class="w-1 h-1 rounded-full bg-gray-500"></span>
                <span class="w-1 h-1 rounded-full bg-gray-500"></span>
                <span class="w-1 h-1 rounded-full bg-gray-500"></span>
              </div>`;
            return gutter;
          }}
        >
          {/* Left: Task Table */}
          <TaskTable
            tasks={tasks}
            visibleTasks={visibleTasks}
            collapsed={collapsed}
            toggleCollapse={toggleCollapse}
            patchTask={patchTask}
            addSubtask={addSubtask}
            setDrawerTask={setDrawerTask}
            setDetailsTask={setDetailsTask}
            setDeleteTarget={setDeleteTarget}
            handleAddTask={handleAddTask}
            colTemplate={COL_TEMPLATE}
            onProtectedDelete={handleProtectedDelete} // ✅ shared handler
            projectId={projectId}
          />

          {/* Right: Gantt Chart */}
          <div className="p-5 bg-white overflow-hidden flex flex-col">
            {chartTasks.length ? (
              <>
                <CustomSlider viewMode={viewMode} setViewMode={setViewMode} />
                <style dangerouslySetInnerHTML={{ __html: groupCss }} />
                <div className="flex-1 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <div className="min-w-[800px]">
                    <FrappeGantt
                      tasks={chartTasks as any}
                      viewMode={viewMode as any}
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
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
                - No chart is available. A chart will be displayed only when the task has defined start and end dates.-
              </div>
            )}
          </div>
        </Split>
      </div>

      {/* Mobile Table */}
      <TaskTableMobile
        tasks={tasks}
        visibleTasks={visibleTasks}
        collapsed={collapsed}
        toggleCollapse={toggleCollapse}
        patchTask={patchTask}
        addSubtask={addSubtask}
        setDrawerTask={setDrawerTask}
        setDetailsTask={setDetailsTask}
        setDeleteTarget={setDeleteTarget}
        handleAddTask={handleAddTask}
        colTemplate={COL_TEMPLATE}
        chartTasks={chartTasks}
        groupCss={groupCss}
        viewMode={viewMode}
        setViewMode={setViewMode}
        patchTaskDebounced={patchTaskDebounced}
        onProtectedDelete={handleProtectedDelete} // ✅ shared handler
      />

      {/* Drawers */}
      {drawerTask && <AssigneeDrawer
  task={drawerTask}
  scope={project?.scope} // ✅ ADD THIS
  onClose={() => setDrawerTask(null)}
/>}
      {detailsTask && (
        <TaskDetailsDrawer task={detailsTask} onClose={() => setDetailsTask(null)} />
      )}

      {/* Standard Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Task?"
        description={
          deleteTarget
            ? `Are you sure you want to delete the task "${deleteTarget.name}"?`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (deleteTarget) {
            removeTaskById(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
        danger
      />

      {/* 🚫 Blocked Delete Warning */}
      <ConfirmDialog
        open={!!blockedDeleteTask}
        title="Cannot Delete Task"
        description={
          blockedDeleteTask ? (
            blockedDeleteTask.reason === "DEPENDENCY" ? (
              <p className="text-sm leading-relaxed">
                The task <strong>"{blockedDeleteTask.task?.name}"</strong> cannot be deleted
                because it is used as a dependency by one or more other tasks.
                <br /><br />
                <span className="text-gray-600">
                  Please remove it from all dependencies first before deleting.
                </span>
              </p>
            ) : (
              <p className="text-sm leading-relaxed">
                The task <strong>"{blockedDeleteTask.task?.name}"</strong> cannot be deleted
                because it has one or more subtasks.
                <br /><br />
                <span className="text-gray-600">
                  Please delete or move all child tasks before deleting this parent task.
                </span>
              </p>
            )
          ) : null
        }
        confirmLabel="Got it"
        danger={false}
        onConfirm={() => setBlockedDeleteTask(null)}
        onClose={() => setBlockedDeleteTask(null)}
      />
    </div>
  );
};

export default Chart;
