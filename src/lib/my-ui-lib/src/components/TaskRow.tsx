// src/chart/TaskRow.tsx
import React, { useContext } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Edit3,
} from "lucide-react";
import DependencyModal from "./DependencyModal";
import AuditOverlay from "./AuditOverlay"; // For editing
import AuditHistoryModal from "./AuditHistoryModal"; // For viewing full history
import { GlobalContext } from "../state/Contexts/GlobalStateProvider";
import { useCan } from "../../../../utils/permissions";
import { TaskRowMobile } from "./TaskRowMobile";
import { PriorityBadge, StatusBadge } from "./Tasks/TaskBadges";
import ConfirmDialog from "../../../../components/ui/ConfirmDialog";
import { useTaskTitleSuggestions } from "../../../../features/tasks/hooks";


type TaskRowProps = {
  task: any;
  level: number;
  tasks: any[];
  onPatch: (id: string, patch: Partial<any>) => void;
  onAddSubtask: (parentId: string) => void;
  toggleCollapse: (taskId: string) => void;
  onOpenAssign: (task: any) => void;
  onOpenDetails: (task: any) => void;
  onRequestDelete: (task: any) => void;
  hasChildren: boolean;
  isCollapsed: boolean;
  colTemplate: string;
  onOpenProgress: (task: any) => void; // New prop
};


const TaskRow: React.FC<TaskRowProps> = ({
  task,
  level,
  tasks,
  onPatch,
  onAddSubtask,
  toggleCollapse,
  hasChildren,
  isCollapsed,
  onOpenAssign,
  onOpenDetails,
  onRequestDelete,
  colTemplate,
  onOpenProgress, // New
}) => {
  const globalCTX = useContext(GlobalContext);
  const can = useCan();
  const canUpdate = can("tasks:update");
  const canDelete = can("tasks:delete"); 

/* ---------- helpers ---------- */
const toISO = (d: string) => new Date(d).toISOString();
const fromISO = (iso?: string) => (iso ? iso.split("T")[0] : "");
const [auditTrigger, setAuditTrigger] = React.useState(0);
const [showSuggestions, setShowSuggestions] = React.useState(false);

const projectId = globalCTX?.projectId;

/* ---------- Audit Config ---------- */
const TASK_AUDIT_FIELDS = [
  'expected_deadline',
  'submission_status',
  'hours'
] as const;

const FIELD_LABELS: Record<string, string> = {
  expected_deadline: 'Expected Deadline',
  submission_status: 'Submission Status',
  priority: 'Priority',
  approval_date: 'Approval Date',
  hours: 'Hours',
};

  // Local states
  const [localName, setLocalName] = React.useState(task.name ?? "");
  const [localStart, setLocalStart] = React.useState(fromISO(task.start));
  const [localEnd, setLocalEnd] = React.useState(fromISO(task.end));
  const [localHours, setLocalHours] = React.useState(
  task.hours != null ? task.hours.toString() : ""
);

type ConfirmDialogState = {
  open: boolean;
  title: string;
  description: string;
  onConfirm?: () => void; // 👈 optional
};

const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState>({
  open: false,
  title: "",
  description: "",
});


  // New stage fields
  const [localExpectedDeadline, setLocalExpectedDeadline] = React.useState(task.expected_deadline?.slice(0, 10) ?? "");
  const [localSubmissionStatus, setLocalSubmissionStatus] = React.useState(task.submission_status ?? "");
  const [localPriority, setLocalPriority] = React.useState(task.priority ?? "");
  const [localApprovalDate, setLocalApprovalDate] = React.useState(task.approval_date?.slice(0, 10) ?? "");

  const [showDepModal, setShowDepModal] = React.useState(false);

  const {
  mutate: fetchSuggestions,
  data: titleSuggestions = [],
} = useTaskTitleSuggestions();

const debounceRef = React.useRef<any>(null);

const handleFetchSuggestions = (value: string) => {
  if (debounceRef.current) clearTimeout(debounceRef.current);

  debounceRef.current = setTimeout(() => {
    if (!projectId || value.length < 2) return;

    fetchSuggestions({
      projectId,
      search: value,
    });
  }, 300);
};

  // Sync from props
  React.useEffect(() => {
    setLocalName(task.name ?? "");
    setLocalStart(fromISO(task.start));
    setLocalEnd(fromISO(task.end));
    setLocalHours(task.hours != null ? task.hours.toString() : "");
    setLocalExpectedDeadline(task.expected_deadline?.slice(0, 10) ?? "");
    setLocalSubmissionStatus(task.submission_status ?? "");
    setLocalPriority(task.priority ?? "");
    setLocalApprovalDate(task.approval_date?.slice(0, 10) ?? "");
  }, [task]);

  // Gantt sync
  const flush = (id: string) => globalCTX?.flushTaskDebounce(id);
const patchStart = (newStart: string) => {
  if (!canUpdate) return;
  const nextStartISO = newStart ? toISO(newStart) : null;
  globalCTX?.patchTaskDebounced(task.id, { start: nextStartISO });
  flush(task.id);
};
const patchEnd = (newEnd: string) => {
  if (!canUpdate) return;
  const nextEndISO = newEnd ? toISO(newEnd) : null;
  globalCTX?.patchTaskDebounced(task.id, { end: nextEndISO });
  flush(task.id);
};

  // === AUDIT LOGIC (for editing) ===
  const auditsRef = React.useRef<
    { field_name: string; old_value: string; new_value: string; note: string }[]
  >([]);

  const [pendingPatch, setPendingPatch] = React.useState<Partial<any>>({});
  const [changedFields, setChangedFields] = React.useState<
    { field: string; oldValue: any; newValue: any }[]
  >([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [auditNote, setAuditNote] = React.useState('');
  const [showAudit, setShowAudit] = React.useState(false);



const queueAuditPatch = (newPatch: Partial<any>) => {
  if (newPatch.hours !== undefined) {
    const newHours = newPatch.hours ?? 0;

    // --- helper: recursively collect all descendants (multi-level) ---
    const getAllDescendants = (taskId: string): any[] => {
      const direct = tasks.filter((t) => t.parentId === taskId);
      return [...direct, ...direct.flatMap((c) => getAllDescendants(c.id))];
    };

    // --- helper: get all ancestors up the tree ---
    const getAncestors = (t: any): any[] => {
      const res: any[] = [];
      let current = t;
      while (current?.parentId) {
        const parent = tasks.find((x) => x.id === current.parentId);
        if (!parent) break;
        res.push(parent);
        current = parent;
      }
      return res;
    };

    // --- helper: compute total hours for a task’s subtree, including current change ---
    const getSubtreeTotal = (taskId: string): number => {
      const descendants = getAllDescendants(taskId);
      let sum = 0;
      for (const d of descendants) {
        if (d.id === task.id) {
          sum += newHours; // include current edit
        } else {
          sum += d.hours ?? 0;
        }
      }
      return sum;
    };

    // --- DOWNWARD VALIDATION (cannot shrink parent below its children) ---
    const children = tasks.filter((t) => t.parentId === task.id);
    const totalChildHours = children.reduce((s, c) => s + (c.hours ?? 0), 0);
    if (totalChildHours > newHours) {
      setConfirmDialog({
        open: true,
        title: "Invalid Hours Reduction",
        description: `Cannot reduce “${task.name}” to ${newHours} hours — its subtasks already total ${totalChildHours} hours.`,
      });
      setLocalHours(task.hours != null ? task.hours.toString() : "");
      return;
    }

    // --- UPWARD VALIDATION (each ancestor’s subtree must not exceed its limit) ---
    const ancestors = getAncestors(task);
    for (const ancestor of ancestors) {
      const totalUnderAncestor = getSubtreeTotal(ancestor.id);
      const ancestorLimit = ancestor.hours ?? 0;
      if (totalUnderAncestor > ancestorLimit) {
        setConfirmDialog({
          open: true,
          title: "Hierarchy Hours Exceeded",
          description: `The total hours under “${ancestor.name}” (${totalUnderAncestor}) exceed its limit of ${ancestorLimit} hours.`,
        });
        setLocalHours(task.hours != null ? task.hours.toString() : "");
        return;
      }
    }
  }

  // ✅ Step 2: Audit logic (only runs if validation passes)
  const changesRequiringAudit: { field: string; oldValue: any; newValue: any }[] = [];

  for (const key of Object.keys(newPatch)) {
    if (!TASK_AUDIT_FIELDS.includes(key as any)) continue;
    const oldValue = task[key];
    const newValue = newPatch[key];
    const isOldEmpty =
      oldValue === null ||
      oldValue === undefined ||
      oldValue === "" ||
      (typeof oldValue === "number" && isNaN(oldValue));
    const isNewEmpty =
      newValue === null ||
      newValue === undefined ||
      newValue === "";
    if (isOldEmpty && !isNewEmpty) continue; // skip first-time audit

    changesRequiringAudit.push({
      field: key,
      oldValue: oldValue ?? "(empty)",
      newValue: newValue ?? "(empty)",
    });
  }

  // 🟡 Step 3: Allocation warning for hours
  if (newPatch.hours !== undefined) {
    const totalAllocated = Array.isArray(task.assignees)
      ? task.assignees.reduce((sum: number, a: any) => sum + (a.hours || 0), 0)
      : 0;
    if (newPatch.hours < totalAllocated) {
      (newPatch as any).__allocationWarning = {
        totalAllocated,
        newTotal: newPatch.hours,
      };
    }
  }

  // ✅ Step 4: Apply or audit
  if (changesRequiringAudit.length > 0) {
    setPendingPatch((prev) => ({ ...prev, ...newPatch }));
    setChangedFields(changesRequiringAudit);
    setCurrentIndex(0);
    setAuditNote("");
    auditsRef.current = [];
    setShowAudit(true);
  } else {
    onPatch(task.id, newPatch);
  }
};



const handleAuditConfirm = () => {
  const current = changedFields[currentIndex];

  const newAuditEntry = {
    field_name: current.field,
    old_value: String(current.oldValue ?? ''),
    new_value: String(current.newValue ?? ''),
    note: auditNote.trim() || '(no note)',
  };

  auditsRef.current.push(newAuditEntry);

  if (currentIndex === changedFields.length - 1) {
    // Build optimistic audit_history entry for UI
    const optimisticAuditHistory = [
      ...(task.audit_history ?? []),
      ...auditsRef.current.map((a) => ({
        id: `tmp-${Date.now()}-${Math.random()}`,
        field_name: a.field_name,
        old_value: a.old_value,
        new_value: a.new_value,
        note: a.note,
        changed_at: new Date().toISOString(),
        changed_by: {
          user_id: "current",
          email: "current",
          full_name: "Current User",
        },
      })),
    ];

    // 🔥 Send patch + inject audit_history locally
    onPatch(task.id, {
      ...pendingPatch,
      audit_entries: auditsRef.current,   // backend
      audit_history: optimisticAuditHistory, // UI
    });

    // Flush debounce immediately
    globalCTX?.flushTaskDebounce?.(task.id);

    // Reset modal state
    setShowAudit(false);
    setPendingPatch({});
    setChangedFields([]);
    setAuditNote('');
    auditsRef.current = [];
  } else {
    setCurrentIndex(currentIndex + 1);
    setAuditNote('');
  }
};


const revertChangedFields = () => {
  changedFields.forEach(({ field, oldValue }) => {
    switch (field) {
      case 'expected_deadline':
        setLocalExpectedDeadline(oldValue?.slice(0, 10) ?? '');
        break;
      case 'submission_status':
        setLocalSubmissionStatus(oldValue ?? '');
        break;
      // Add priority, approval_date later if needed
    }
  });
};

const handleAuditCancel = () => {
  revertChangedFields();

  setShowAudit(false);
  setPendingPatch({});
  setChangedFields([]);
  setAuditNote('');
  auditsRef.current = [];
};
  const currentAuditField = showAudit && changedFields.length > 0 ? changedFields[currentIndex] : null;

  // === VIEW FULL AUDIT HISTORY MODAL ===
  const [showAuditHistory, setShowAuditHistory] = React.useState(false);

  const [assigneeOverlayTask, setAssigneeOverlayTask] = React.useState<any>(null);


  const totalAllocated = Array.isArray(task.assignees)
  ? task.assignees.reduce((sum: number, a: any) => sum + (a.hours || 0), 0)
  : 0;

const totalHours = Number(task.hours || 0);
const remainingHours = Math.max(0, totalHours - totalAllocated);

  /* ================= Desktop Row ================= */
  const desktopRow = (
    <div
      key={task.id}
      role="row"
      className={`hidden sm:grid ${colTemplate} items-start  px-4 py-3 gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-none`}
    >
      {/* Title & controls */}
     <div
  role="cell"
  style={{ paddingLeft: `${level * 24}px` }}
  className="flex items-start gap-2 min-w-0 sticky left-0 z-[10] bg-white shadow-right"
>
        {hasChildren ? (
          <button
            onClick={() => toggleCollapse(task.id)}
            className="flex items-center justify-center w-6 h-6 text-gray-500 hover:text-gray-700 transition shrink-0"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}

        {canUpdate && (
          <button
            onClick={() => onAddSubtask(task.id)}
            className="flex items-center justify-center w-6 h-6 rounded-md bg-green-100 text-green-600 hover:bg-green-200 transition shrink-0"
            title="Add subtask"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        )}

{canUpdate ? (
  <div className="flex-1 min-w-0 relative">
    <input
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
      className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
    />

{showSuggestions && titleSuggestions.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-2">
    <span className="text-xs text-gray-400 mr-1">Suggestions:</span>

    {titleSuggestions.slice(0, 6).map((s, i) => (
      <button
        key={i}
        type="button"
        className="px-2 py-1 text-xs rounded-md border bg-gray-50 
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
  <span className="text-gray-800 text-sm font-medium">{localName}</span>
)}

        <PriorityBadge priority={localPriority} />
        <StatusBadge status={localSubmissionStatus} />
      </div>

      {/* Details */}
      <div role="cell" className="flex justify-center">
        <button onClick={() => onOpenDetails(task)} className="btn-projected">
          Details
        </button>
      </div>

      {/* Start / End */}
      {canUpdate ? (
        <>
          <input
            type="date"
            value={localStart || ""}
            onChange={(e) => {
    setLocalStart(e.target.value);
  }}
  onBlur={() => {
    if (localStart !== fromISO(task.start)) {
      patchStart(localStart);
    }
  }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
          />
          <input
            type="date"
            value={localEnd || ""}
            onChange={(e) => {
              setLocalEnd(e.target.value);
            }}
            onBlur={() => {
              if (localEnd !== fromISO(task.end)) {
                patchEnd(localEnd);
              }
            }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
          />
        </>
      ) : (
        <>
          <span className="text-sm text-gray-700">{localStart || '-'}</span>
          <span className="text-sm text-gray-700">{localEnd || '-'}</span>
        </>
      )}

      {/* Hours */}
      <div role="cell" className="text-center text-sm text-gray-600 font-medium">
        {canUpdate ? (
          <input
            type="number"
            min="0"
            step="0.25"
            value={localHours}
             onChange={(e) => setLocalHours(e.target.value)}
onBlur={() => {
  if (localHours.trim() === "") {
    // allow clearing → save NULL
    queueAuditPatch({ hours: null });
    return;
  }

  const val = parseFloat(localHours);
  if (!isNaN(val) && val !== task.hours) {
    queueAuditPatch({ hours: val });
  }
}}

            className="w-20 text-center border border-gray-300 rounded-md px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
          />
        ) : (
           <span>{task.hours ?? '-'}</span>

        )}
      </div> 
 
      {/* Expected Deadline */}
<div role="cell">
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
      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
    />
  ) : (
    <span>{task.expected_deadline?.slice(0, 10) || '-'}</span>
  )}
</div>
      {/* Submission Status */}
<div role="cell">
  {canUpdate ? (
    <select
      value={localSubmissionStatus}
      onChange={(e) => {
        const newValue = e.target.value || null; // "" → null if "Select" is chosen
        setLocalSubmissionStatus(newValue);

        // Only trigger queueAuditPatch if the value actually changed
        if (newValue !== task.submission_status) {
          queueAuditPatch({ submission_status: newValue });
        }
      }}
      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
    >
      <option value="">Select</option>
      <option value="not_started">Not Started</option>
      <option value="in_progress">In Progress</option>
      <option value="submitted">Submitted</option>
    </select>
  ) : (
    <span>{task.submission_status || '-'}</span>
  )}
</div>

      {/* Priority */}
      <div role="cell">
        {canUpdate ? (
          <select
            value={localPriority}
            onChange={(e) => {
              setLocalPriority(e.target.value);
              if (e.target.value !== task.priority) {
                queueAuditPatch({ priority: e.target.value || null });
              }
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
          >
            <option value="">Select</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        ) : (
          <span>{task.priority || '-'}</span>
        )}
      </div>

      {/* Approval Date */}
      <div role="cell">
        {canUpdate ? (
          <input
            type="date"
            value={localApprovalDate}
           onChange={(e) => {
  setLocalApprovalDate(e.target.value);
}}
onBlur={() => {
  const newValue = localApprovalDate || null;
  const oldValue = task.approval_date?.slice(0, 10) || null;

  if (newValue !== oldValue) {
    queueAuditPatch({ approval_date: newValue });
  }
}}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
          />
        ) : (
          <span>{task.approval_date?.slice(0, 10) || '-'}</span>
        )}
      </div>

      {/* Dependencies */}
      <div role="cell" className="flex justify-center">
        {canUpdate ? (
          <button
            onClick={() => setShowDepModal(true)}
            className={task.dependencies?.length ? "btn-label btn-label--deps" : "btn-projected"}
          >
            {task.dependencies?.length ? "Dependency" : "Select"}
          </button>
        ) : (
          <span className="text-gray-500 text-sm italic">
            {task.dependencies?.length ? "Has dependencies" : "None"}
          </span>
        )}
      </div>

      {/* Audits Column */}
<div role="cell" className="flex justify-center">
  {task.audit_history && task.audit_history.length > 0 ? (
    <button
      onClick={() => setShowAuditHistory(true)}
      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition"
    >
      <Edit3 className="w-4 h-4" />
      View ({task.audit_history.length})
    </button>
  ) : (
    <span className="text-gray-400 text-sm">—</span>
  )}
</div>

      {/* Progress Column - New */}
      <div role="cell" className="flex justify-center">
        <button
          onClick={() => onOpenProgress(task)}
          className="btn-projected"
        >
          View
        </button>
      </div>

      {/* Assignees */}
      <div role="cell" className="min-w-[12rem] px-2 py-1">
        <div className="flex items-center gap-2 flex-wrap">
          {Array.isArray(task.assignees) && task.assignees.length > 0 ? (
            <>
              {/* Show only first 2 assignees */}
              {task.assignees.slice(0, 2).map((emp: any) => (
                <span
                  key={emp.id ?? emp.employee_id ?? emp}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium shadow-sm"
                >
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-semibold">
                    {typeof emp === "string"
                      ? emp[0]?.toUpperCase() ?? "?"
                      : emp.full_name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  <span className="truncate max-w-[6rem]">
                    {typeof emp === "string" ? emp : emp.full_name ?? emp.email ?? "Unknown"}
                  </span>
                </span>
              ))}

              {/* +n more badge if there are more than 2 */}
              {task.assignees.length > 2 && (
                <button
                  onClick={() => setAssigneeOverlayTask(task)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline transition"
                >
                  +{task.assignees.length - 2} more
                </button>
              )}
            </>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-400 text-[11px] italic">
              Unassigned
            </span>
          )}

          {/* Assign button - aligned to the right */}
       {canUpdate && (
        <button
          onClick={() => onOpenAssign(task)}
          className={`ml-auto px-3 py-1 text-xs rounded-md transition font-medium
            ${
              remainingHours > 0
                ? "border border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          title={
            remainingHours > 0
              ? `⚠️ ${remainingHours} hours remain unassigned`
              : "Assign employees"
          }
        >
          Assign
        </button>
      )}

        </div>
      </div>

      {/* Actions */}
      <div role="cell" className="flex justify-center items-center min-h-[2rem]">
        {canDelete ? (
          <button
            onClick={() => onRequestDelete(task)}
            className="flex items-center justify-center w-8 h-8 rounded-md text-red-500 hover:bg-red-100 transition"
          >
            <Trash2 size={16} strokeWidth={2} />
          </button>
        ) : (
          <span className="text-xs text-gray-400 italic select-none">
            Restricted Access
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {desktopRow}

      <TaskRowMobile
        task={task}
        canUpdate={canUpdate}
        canDelete={canDelete}
        localName={localName}
        setLocalName={setLocalName}
        localStart={localStart}
        setLocalStart={setLocalStart}
        localEnd={localEnd}
        setLocalEnd={setLocalEnd}
        localHours={localHours}
        setLocalHours={setLocalHours}
        patchStart={patchStart}
        patchEnd={patchEnd}
        onPatch={onPatch}
        onAddSubtask={onAddSubtask}
        onRequestDelete={onRequestDelete}
        toggleCollapse={toggleCollapse}
        hasChildren={hasChildren}
        isCollapsed={isCollapsed}
        onOpenAssign={onOpenAssign}
        onOpenDetails={onOpenDetails}
        tasks={tasks}
        showDepModal={showDepModal}
        setShowDepModal={setShowDepModal}
        localExpectedDeadline={localExpectedDeadline}
        setLocalExpectedDeadline={setLocalExpectedDeadline}
        localSubmissionStatus={localSubmissionStatus}
        setLocalSubmissionStatus={setLocalSubmissionStatus}
        localPriority={localPriority}
        setLocalPriority={setLocalPriority}
        localApprovalDate={localApprovalDate}
        setLocalApprovalDate={setLocalApprovalDate}
        queueAuditPatch={queueAuditPatch}
        onOpenProgress={onOpenProgress}
        titleSuggestions={titleSuggestions}
        handleFetchSuggestions={handleFetchSuggestions}
      />

      {showDepModal && canUpdate && (
        <DependencyModal
          task={task}
          tasks={tasks}
          onClose={() => setShowDepModal(false)}
          onSave={(deps: string[]) => {
            onPatch(task.id, { dependencies: deps });
            setShowDepModal(false);
          }}
        />
      )}

      {/* Audit Editing Overlay */}
      {showAudit && currentAuditField && (
        <AuditOverlay
  field={FIELD_LABELS[currentAuditField.field] || currentAuditField.field}
  oldValue={currentAuditField.oldValue ?? 'N/A'}
  newValue={currentAuditField.newValue ?? 'N/A'}
  note={auditNote}
  onChangeNote={setAuditNote}
  onCancel={handleAuditCancel}
  onConfirm={handleAuditConfirm}
  extraMessage={
    pendingPatch.__allocationWarning &&
    currentAuditField.field === "hours" && (
      <div className="mt-3 text-amber-600 text-sm font-medium text-center border border-amber-300 bg-amber-50 rounded-lg p-2">
        ⚠ Allocated hours (
        {pendingPatch.__allocationWarning.totalAllocated}h) exceed new total (
        {pendingPatch.__allocationWarning.newTotal}h).  
        Please adjust allocations or confirm to proceed.
      </div>
    )
  }
/>

      )}

      {/* Full Audit History Modal */}
      {showAuditHistory && (
        <AuditHistoryModal
          projectName={task.name || "Task"}
          auditHistory={task.audit_history || []}
          onClose={() => setShowAuditHistory(false)}
        />
      )}
            {/* Full Assignees Overlay */}
      {assigneeOverlayTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[70vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold text-lg">All Assignees</h3>
              <button
                onClick={() => setAssigneeOverlayTask(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="font-medium text-gray-700 mb-3">
                {assigneeOverlayTask.name}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {assigneeOverlayTask.assignees.map((emp: any) => (
                  <span
                    key={emp.id ?? emp.employee_id ?? emp}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium"
                  >
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-semibold">
                      {typeof emp === "string"
                        ? emp[0]?.toUpperCase() ?? "?"
                        : emp.full_name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                    {typeof emp === "string" ? emp : emp.full_name ?? emp.email ?? "Unknown"}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => setAssigneeOverlayTask(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

<ConfirmDialog
  open={confirmDialog.open}
  title={confirmDialog.title}
  description={confirmDialog.description}
  confirmLabel="Close"
  hideCancel={true}
  onConfirm={() => setConfirmDialog({ open: false, title: "", description: "" })}
  onClose={() => setConfirmDialog({ open: false, title: "", description: "" })}
/>

    </>
  );
};

export default TaskRow;