// src/chart/TaskRowMobile.tsx
import React from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import DependencyModal from "./DependencyModal";
import { PriorityBadge, StatusBadge } from "./Tasks/TaskBadges";
import AuditHistoryModal from "./AuditHistoryModal";


type TaskRowMobileProps = {
  task: any;
  canUpdate: boolean;
  canDelete: boolean;
  localName: string;
  setLocalName: (name: string) => void;
  localStart: string;
  setLocalStart: (date: string) => void;
  localEnd: string;
  setLocalEnd: (date: string) => void;
  localHours: string;
  setLocalHours: (hours: string) => void;
  localExpectedDeadline: string;
  setLocalExpectedDeadline: (date: string) => void;
  localSubmissionStatus: string;
  setLocalSubmissionStatus: (status: string) => void;
  localPriority: string;
  setLocalPriority: (priority: string) => void;
  localApprovalDate: string;
  setLocalApprovalDate: (date: string) => void;
  patchStart: (start: string, end?: string) => void;
  patchEnd: (end: string, start?: string) => void;
  onPatch: (id: string, patch: Partial<any>) => void;
  onAddSubtask: (id: string) => void;
  onRequestDelete: (task: any) => void; // handled by parent ConfirmDialog
  toggleCollapse: (id: string) => void;
  hasChildren: boolean;
  isCollapsed: boolean;
  onOpenAssign: (task: any) => void;
  onOpenDetails: (task: any) => void;
  onOpenProgress: (task: any) => void;
  tasks: any[];
  showDepModal: boolean;
  setShowDepModal: (open: boolean) => void;
  queueAuditPatch: (patch: Partial<any>) => void;
  titleSuggestions: string[];
  handleFetchSuggestions: (value: string) => void;
};

export const TaskRowMobile: React.FC<TaskRowMobileProps> = ({
  task,
  canUpdate,
  canDelete,
  localName,
  setLocalName,
  localStart,
  setLocalStart,
  localEnd,
  setLocalEnd,
  localHours,
  setLocalHours,
  localExpectedDeadline,
  setLocalExpectedDeadline,
  localSubmissionStatus,
  setLocalSubmissionStatus,
  localPriority,
  setLocalPriority,
  localApprovalDate,
  setLocalApprovalDate,
  patchStart,
  patchEnd,
  onPatch,
  onAddSubtask,
  onRequestDelete,
  toggleCollapse,
  hasChildren,
  isCollapsed,
  onOpenAssign,
  onOpenDetails,
  onOpenProgress,
  tasks,
  showDepModal,
  setShowDepModal,
  queueAuditPatch,
  titleSuggestions,
  handleFetchSuggestions,
}) => {

  const [showAuditHistory, setShowAuditHistory] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);


  return (
    <div className="sm:hidden mb-6">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-md border-t border-gray-200 overflow-hidden w-full">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            {/* Collapse Toggle */}
            {hasChildren && (
              <button
                onClick={() => toggleCollapse(task.id)}
                className="mt-1 w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                aria-label="Toggle subtasks"
              >
                {isCollapsed ? <ChevronRight size={22} /> : <ChevronDown size={22} />}
              </button>
            )}

            {/* Task Name */}
            <div className="flex-1 min-w-0">
              {canUpdate ? (
               <div className="w-full">
  <input
    type="text"
    value={localName}
    onChange={(e) => {
      const val = e.target.value;
      setLocalName(val);
      setShowSuggestions(true);
      handleFetchSuggestions(val);
    }}
    onBlur={() => {
      const trimmed = localName.trim();
      if (trimmed && trimmed !== task.name) {
        onPatch(task.id, { name: trimmed });
      }
      setTimeout(() => setShowSuggestions(false), 150);
    }}
    className="w-full px-4 py-3 text-lg font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none"
    placeholder="Enter task name"
  />
{showSuggestions && titleSuggestions.length > 0 && (
  <div className="mt-3 flex flex-wrap gap-2">
    <span className="text-xs text-gray-400 w-full">Suggestions:</span>

    {titleSuggestions.slice(0, 6).map((s, i) => (
      <button
        key={i}
        type="button"
        className="px-3 py-1.5 text-xs rounded-lg border bg-gray-50 
                   hover:bg-indigo-50 hover:border-indigo-300 
                   text-gray-700 transition"
        onMouseDown={(e) => {
          e.preventDefault();
          setLocalName(s);
          onPatch(task.id, { name: s });
          setShowSuggestions(false);
        }}
      >
        {s}
      </button>
    ))}
  </div>
)}
</div>
              ) : (
                <h3 className="text-lg font-bold text-gray-900 pr-2">{localName}</h3>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {canUpdate && (
                <button
                  onClick={() => onAddSubtask(task.id)}
                  className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center transition"
                  aria-label="Add subtask"
                >
                  <Plus size={22} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onRequestDelete(task)} // delegate to parent
                  className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 flex items-center justify-center transition"
                  aria-label="Delete task"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <PriorityBadge priority={localPriority} />
            <StatusBadge status={localSubmissionStatus} />
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Start & End Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={localStart || ""}
                  onChange={(e) => {
    setLocalStart(e.target.value);
  }}
  onBlur={() => {
    if (localStart !== task.start?.slice(0, 10)) {
      patchStart(localStart, localEnd);
    }
  }}
            disabled={!canUpdate}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={localEnd || ""}
                onChange={(e) => {
    setLocalEnd(e.target.value);
  }}
  onBlur={() => {
    if (localEnd !== task.end?.slice(0, 10)) {
      patchEnd(localEnd, localStart);
    }
  }}
                disabled={!canUpdate}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          {/* Hours */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Estimated Hours
            </label>
            {canUpdate ? (
              <input
                type="number"
                min="0"
                step="0.25"
                value={localHours}
                onChange={(e) => setLocalHours(e.target.value)}
                onBlur={() => {
                  const val = parseFloat(localHours);
                  if (!isNaN(val) && val !== task.hours) {
                    queueAuditPatch({ hours: val });
                  }
                }}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl"
                placeholder="e.g. 40"
              />
            ) : (
              <div className="px-4 py-3 text-sm bg-gray-50 rounded-xl text-gray-700">
                {task.hours ?? 0}h
              </div>
            )}
          </div>

          {/* Expected Deadline */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Expected Deadline
            </label>
            {canUpdate ? (
              <input
                type="date"
                value={localExpectedDeadline}
                onChange={(e) => {
  setLocalExpectedDeadline(e.target.value);
}}
onBlur={() => {
  const newValue = localExpectedDeadline || null;
  const oldValue = task.expected_deadline?.slice(0, 10) || null;

  if (newValue !== oldValue) {
    queueAuditPatch({ expected_deadline: newValue });
  }
}}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl"
              />
            ) : (
              <div className="px-4 py-3 text-sm bg-gray-50 rounded-xl text-gray-700">
                {task.expected_deadline?.slice(0, 10) || "-"}
              </div>
            )}
          </div>

          {/* Submission Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Submission Status
            </label>
            {canUpdate ? (
              <select
                value={localSubmissionStatus}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setLocalSubmissionStatus(val);
                  if (val !== task.submission_status) {
                    queueAuditPatch({ submission_status: val });
                  }
                }}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white"
              >
                <option value="">Select status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
              </select>
            ) : (
              <div className="px-4 py-3 text-sm bg-gray-50 rounded-xl text-gray-700 capitalize">
                {task.submission_status || "-"}
              </div>
            )}
          </div>

          {/* Priority & Approval Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Priority
              </label>
              {canUpdate ? (
                <select
                  value={localPriority}
                  onChange={(e) => {
                    const val = e.target.value || null;
                    setLocalPriority(val);
                    if (val !== task.priority) {
                      onPatch(task.id, { priority: val });
                    }
                  }}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white"
                >
                  <option value="">Select</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <div className="px-4 py-3 text-sm bg-gray-50 rounded-xl text-gray-700 capitalize">
                  {task.priority || "-"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Approval Date
              </label>
              {canUpdate ? (
               <input
  type="date"
  value={localApprovalDate}
  onChange={(e) => setLocalApprovalDate(e.target.value)}
  onBlur={() => {
    const newValue = localApprovalDate || null;
    const oldValue = task.approval_date?.slice(0, 10) || null;

    if (newValue !== oldValue) {
      onPatch(task.id, { approval_date: newValue });
    }
  }}
  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl"
/>
              ) : (
                <div className="px-4 py-3 text-sm bg-gray-50 rounded-xl text-gray-700">
                  {task.approval_date?.slice(0, 10) || "-"}
                </div>
              )}
            </div>
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Dependencies
            </label>
            {canUpdate ? (
              <button
                onClick={() => setShowDepModal(true)}
                className="w-full text-left px-4 py-3.5 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition text-gray-700"
              >
                {task.dependencies?.length
                  ? task.dependencies
                      .map(
                        (id: string) =>
                          tasks.find((t) => t.id === id)?.name || `(ID: ${id})`
                      )
                      .join(", ")
                  : "None selected"}
              </button>
            ) : (
              <div className="px-4 py-3.5 text-sm bg-gray-50 rounded-xl text-gray-700">
                {task.dependencies?.length
                  ? `${task.dependencies.length} dependency(ies)`
                  : "None"}
              </div>
            )}
          </div>
          {/* Audits */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Audits
          </label>
          {task.audit_history && task.audit_history.length > 0 ? (
            <button
              onClick={() => setShowAuditHistory(true)}
              className="w-full text-left px-4 py-3.5 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 text-indigo-600 font-medium transition"
            >
              View ({task.audit_history.length})
            </button>
          ) : (
            <div className="px-4 py-3.5 text-sm bg-gray-50 rounded-xl text-gray-400 italic">
              No audits available
            </div>
          )}
        </div>


          {/* Assignees */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Assignees
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {task.assignees?.length > 0 ? (
                task.assignees.map((emp: any) => (
                  <div
                    key={emp.id ?? emp.employee_id ?? emp}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                      {(emp.full_name || emp.email || "?")[0].toUpperCase()}
                    </div>
                    <span className="truncate max-w-28">
                      {emp.full_name || emp.email || "Unknown"}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">Unassigned</span>
              )}
              {canUpdate && (
                <button
                  onClick={() => onOpenAssign(task)}
                  className="ml-auto px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Assign
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="mt-6 border-t border-gray-200 flex">
          <button
            onClick={() => onOpenProgress(task)}
            className="flex-1 py-4 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
          >
            View Progress
          </button>
          <button
            onClick={() => onOpenDetails(task)}
            className="flex-1 py-4 text-center bg-gray-700 hover:bg-gray-800 text-white font-semibold text-sm transition"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Dependency Modal */}
      {showDepModal && canUpdate && (
        <DependencyModal
          task={task}
          tasks={tasks}
          onClose={() => setShowDepModal(false)}
          onSave={(deps) => {
            onPatch(task.id, { dependencies: deps });
            setShowDepModal(false);
          }}
        />
      )}
      {showAuditHistory && (
  <AuditHistoryModal
    projectName={task.name || "Task"}
    auditHistory={task.audit_history || []}
    onClose={() => setShowAuditHistory(false)}
  />
)}

    </div>
  );
};
