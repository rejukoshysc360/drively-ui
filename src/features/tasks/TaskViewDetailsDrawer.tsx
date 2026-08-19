import React from "react";
import dayjs from "dayjs";
import TaskCommentsSection from "./TaskCommentsSection";
import { APP_CONFIG } from "../../../src/config/appConfig";
import { useCan } from "../../utils/permissions"; // ✅ add permission hook

type Props = { task: any; onClose: () => void };

const TaskViewDetailsDrawer: React.FC<Props> = ({ task, onClose }) => {
  const can = useCan(); // ✅ initialize RBAC hook
  
  const canUpdate = can("tasks:update") || can("tasks:update_own_record_only");

  const startDate = task.start_date ? dayjs(task.start_date).format("YYYY-MM-DD") : "-";
  const endDate = task.end_date ? dayjs(task.end_date).format("YYYY-MM-DD") : "-";
  const duration = task.hours ? `${task.hours}h` : "-";



  const statusLabel =
    APP_CONFIG.STATUS_OPTIONS_SUB.find((opt) => opt.value === task.status)?.label ??
    task.status;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[600px] bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Task Details
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Project */}
          <div>
            <div className="text-xs sm:text-sm text-gray-500 mb-1">Project</div>
            <div className="font-medium text-sm sm:text-base">
              {task.project_code
                ? `${task.project_code} - ${task.project_name}`
                : task.project_name || "-"}
            </div>
          </div>

          {/* Created By */}
          {task.created_by_email && (
            <div>
              <div className="text-xs sm:text-sm text-gray-500 mb-1">Created By</div>
              <div className="font-medium text-sm sm:text-base text-gray-800 break-words">
                {task.created_by_email}
              </div>
            </div>
          )}

          {/* Status + Priority */}
          <div className="flex flex-col sm:flex-row sm:gap-6 gap-3">
            <div>
              <div className="text-xs sm:text-sm text-gray-500 mb-1">Status</div>
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs sm:text-sm">
                {statusLabel}
              </span>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-500 mb-1">Priority</div>
              <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-600 text-xs sm:text-sm">
                {task.priority}
              </span>
            </div>
          </div>

          <hr />

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div>
              <div className="text-gray-500 mb-1">Start Date</div>
              <div className="font-semibold">{startDate}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">End Date</div>
              <div className="font-semibold">{endDate}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Duration</div>
              <div className="font-semibold">{duration}</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs sm:text-sm font-medium mb-1">Description</div>
            <div className="p-3 rounded-md bg-gray-50 border text-xs sm:text-sm">
              {task.description || "-"}
            </div>
          </div>

          {/* Comments */}
          {canUpdate ? (
            <TaskCommentsSection task={task} projectId={task.project_id} />
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50 text-sm text-gray-500 italic text-center">
              Restricted Access — you don’t have permission to add or edit comments.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TaskViewDetailsDrawer;
