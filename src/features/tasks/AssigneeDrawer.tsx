import React from "react";
import { useAssignableEmployeesByOrgId } from "../../features/employees/hooks";
import { useAssignEmployeesToTask } from "../../features/tasks/hooks";
import { useTaskProgress } from "../../features/timesheets/hooks";
import { useOrganizations } from "../../features/organizations/hooks";
import { useAuth } from "../../features/auth/AuthProvider";
import { useParams } from "react-router-dom";
import { GlobalContext } from "../../lib/my-ui-lib/src/state/Contexts/GlobalStateProvider";
import { useEmployeeGroups } from "../../features/employees/groups/hooks";
import { useEmployeeGroup } from "../../features/employees/groups/hooks";

type Props = {
  task: any;
  scope?: "cross_organization" | "current_organization";
  onClose: () => void;
};

const AssigneeDrawer: React.FC<Props> = ({ task,scope, onClose }) => {
  const ctx = React.useContext(GlobalContext);
  if (!ctx) return null;

  const { patchTaskDebounced } = ctx;
  const { projectId } = useParams<{ projectId: string }>();
  const assignEmployeesMutation = useAssignEmployeesToTask(projectId!);
  const { organization_id: defaultOrgId } = useAuth();

  // Load organizations
  const { data: orgsData, isLoading: orgsLoading } = useOrganizations(1, 10);
  const allOrganizations = orgsData?.organizations ?? [];

const organizations =
  scope === "current_organization"
    ? allOrganizations.filter((org: any) => org.id === defaultOrgId)
    : allOrganizations;

  // Selected organization
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>(
    defaultOrgId || ""
  );

  // Detect selection type
const [selectionType, setSelectionType] = React.useState<"org" | "group">("org");

// Selected group employees
const [groupEmployees, setGroupEmployees] = React.useState<any[]>([]);
const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null);


const { data: groupsData } = useEmployeeGroups(1, 100);
const groups = groupsData?.groups ?? [];

const { data: groupDetails, isLoading: groupLoading } = useEmployeeGroup(
  selectedGroupId || ""
);

const [selectedValue, setSelectedValue] = React.useState<string>(
  defaultOrgId || ""
);

  // Employees for selected org
const employeesQuery = useAssignableEmployeesByOrgId(
  1,
  100,
  selectedOrgId || ""
);

  const employees =
  selectionType === "group"
    ? groupDetails?.employees || [] // ✅ USE REAL DATA
    : employeesQuery?.data?.employees ?? [];

const employeesLoading =
  selectionType === "group"
    ? groupLoading
    : !!selectedOrgId && employeesQuery?.isLoading;

  // ✅ Cache for all loaded employees across orgs
  const [employeeCache, setEmployeeCache] = React.useState<Record<string, any>>(
    {}
  );

  React.useEffect(() => {
    if (employees.length > 0) {
      setEmployeeCache((prev) => {
        const next = { ...prev };
        employees.forEach((e) => {
          next[e.id] = e;
        });
        return next;
      });
    }
  }, [employees]);


  React.useEffect(() => {
  if (
    scope === "current_organization" &&
    defaultOrgId &&
    selectedOrgId !== defaultOrgId
  ) {
    setSelectedOrgId(defaultOrgId);
    setSelectedValue(defaultOrgId);
  }
}, [scope, defaultOrgId]);

  // Logged hours
  const { data: progressData = [] } = useTaskProgress(projectId!, task.id);
  const loggedHoursByEmployee = React.useMemo(() => {
    const map: Record<string, number> = {};
    progressData.forEach((p: any) => {
      if (p.employee?.id) map[p.employee.id] = p.completed_hours || 0;
    });
    return map;
  }, [progressData]);

  // Local state
  const [selected, setSelected] = React.useState<string[]>([]);
  const [hoursByEmployee, setHoursByEmployee] = React.useState<
    Record<string, number>
  >({});
  const [showSavedMsg, setShowSavedMsg] = React.useState(false);
  const [saveVersion, setSaveVersion] = React.useState(0); // 🆕 Tracks saves

  const totalTaskHours = Number(task.hours ?? 0);

  // Track initial state for dirty detection
  const initialSelectedRef = React.useRef<string[]>([]);
  const initialHoursRef = React.useRef<Record<string, number>>({});

  /** Preload existing assignments */
  React.useEffect(() => {
    if (Array.isArray(task.assignees) && task.assignees.length > 0) {
      const sel: string[] = [];
      const hrs: Record<string, number> = {};

      task.assignees.forEach((a: any) => {
        const id = a.employee_id || a.id;
        if (id) {
          sel.push(id);
          const allocated = Number(a.hours) || 0;
          const logged = loggedHoursByEmployee[id] || 0;
          hrs[id] = Math.max(allocated, logged);
        }
      });

      setSelected(sel);
      setHoursByEmployee(hrs);

      initialSelectedRef.current = sel;
      initialHoursRef.current = { ...hrs };
    } else {
      initialSelectedRef.current = [];
      initialHoursRef.current = {};
    }
  }, [task, loggedHoursByEmployee]);

  /** Derived: has unsaved changes? */
  const hasUnsavedChanges = React.useMemo(() => {
    if (selected.length !== initialSelectedRef.current.length) return true;

    const selectedSet = new Set(selected);
    const initialSet = new Set(initialSelectedRef.current);
    if (
      selected.some((id) => !initialSet.has(id)) ||
      initialSelectedRef.current.some((id) => !selectedSet.has(id))
    ) {
      return true;
    }

    for (const id of selected) {
      if ((hoursByEmployee[id] ?? 0) !== (initialHoursRef.current[id] ?? 0)) {
        return true;
      }
    }

    return false;
  }, [selected, hoursByEmployee, saveVersion]); // 🆕 include saveVersion

  const totalAllocatedHours = React.useMemo(
    () => selected.reduce((sum, id) => sum + (hoursByEmployee[id] || 0), 0),
    [selected, hoursByEmployee]
  );

  const remainingHours = Math.max(0, totalTaskHours - totalAllocatedHours);

  const hasViolation = React.useMemo(
    () =>
      selected.some((id) => {
        const allocated = hoursByEmployee[id] || 0;
        const logged = loggedHoursByEmployee[id] || 0;
        return allocated < logged;
      }),
    [selected, hoursByEmployee, loggedHoursByEmployee]
  );

  /*const canSave =
    selectedOrgId &&
    hasUnsavedChanges &&
    (selected.length === 0 ||
      (!hasViolation &&
        totalAllocatedHours > 0 &&
        totalAllocatedHours <= totalTaskHours));*/
const canSave =
  (selectionType === "group" || selectedOrgId) &&
  hasUnsavedChanges &&
  !hasViolation;


  /** Helpers */
  const toggleEmployee = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        const { [id]: _, ...rest } = hoursByEmployee;
        setHoursByEmployee(rest);
        return prev.filter((x) => x !== id);
      }
      const logged = loggedHoursByEmployee[id] || 0;
      setHoursByEmployee((prev) => ({
        ...prev,
        [id]: Math.max(hoursByEmployee[id] ?? 0, logged),
      }));
      return [...prev, id];
    });
  };

  const updateHours = (employeeId: string, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setHoursByEmployee((prev) => ({
        ...prev,
        [employeeId]: value === "" ? 0 : parseFloat(value) || 0,
      }));
    }
  };

  const splitEqually = () => {
    if (selected.length === 0 || totalTaskHours <= 0) return;
    const perPerson = Math.floor((totalTaskHours / selected.length) * 100) / 100;
    const next: Record<string, number> = {};
    selected.forEach((id) => {
      const logged = loggedHoursByEmployee[id] || 0;
      next[id] = Math.max(perPerson, logged);
    });
    setHoursByEmployee(next);
  };

  /** SAVE */
  const save = async () => {
    if (!(selectionType === "group" || selectedOrgId) || !hasUnsavedChanges) return;

    if (selected.length === 0) {
      patchTaskDebounced(task.id, { assignees: [] });
      await assignEmployeesMutation.mutateAsync({
        taskId: task.id,
        assignments: [],
      });
      // ✅ Keep drawer open, reset unsaved state
      initialSelectedRef.current = [];
      initialHoursRef.current = {};
      setSaveVersion((v) => v + 1);
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 2000);
      return;
    }

    const assignments = selected.map((id) => {
      // ✅ Use cached employees first
      const currentEmp =
        employeeCache[id] || employees.find((e: any) => e.id === id);
      const existing = task.assignees?.find(
        (a: any) => (a.employee_id || a.id) === id
      );

      let fullName = "Unknown Employee";
      if (currentEmp?.full_name) {
        fullName = currentEmp.full_name;
      } else if (existing) {
        fullName =
          typeof existing === "string"
            ? existing
            : existing.full_name || existing.email || "Unknown Employee";
      }

      return {
        employee_id: id,
        full_name: fullName,
        hours: hoursByEmployee[id] || 0,
      };
    });

    patchTaskDebounced(task.id, {
      assignees: assignments,
      allocations: { mode: "effort", total_hours: totalTaskHours },
    });

    await assignEmployeesMutation.mutateAsync({
      taskId: task.id,
      assignments,
    });

    // ✅ Don’t close drawer; mark as saved and reset unsaved state
    initialSelectedRef.current = [...selected];
    initialHoursRef.current = { ...hoursByEmployee };
    setSaveVersion((v) => v + 1);
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 2000);
  };

  /** RENDER */
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose}></div>

      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-xl z-50 flex flex-col">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold text-lg">Assign Employees</h3>
          <button
            className="text-gray-500 hover:text-gray-700 text-xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {showSavedMsg && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-2 border-b border-green-200">
            ✅ Saved successfully
          </div>
        )}

        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* Organization Selector */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Select Organization/Group
            </label>
            {orgsLoading ? (
              <div className="text-sm text-gray-500">
                Loading organizations…
              </div>
            ) : (
              <>
              <select
                value={selectedValue}
                onChange={(e) => {
  const value = e.target.value;

  setSelectedValue(value); // ✅ THIS FIXES DROPDOWN UI

  if (value.startsWith("group:")) {
    const groupId = value.replace("group:", "");

    setSelectionType("group");
    setSelectedGroupId(groupId);
    setSelectedOrgId(""); // keep this for logic
  } else {
    setSelectionType("org");
    setSelectedOrgId(value);
    setSelectedGroupId(null);
  }
}}
                disabled={hasUnsavedChanges}
                className={`w-full border rounded-md px-3 py-2 text-sm ${
                  hasUnsavedChanges ? "bg-gray-50 cursor-not-allowed text-gray-500" : ""
                }`}
              >
  <option value="">-- Select Organization / Group --</option>

{/* ✅ ORG SECTION */}
<optgroup label="Organizations">
  {organizations.map((org: any) => (
    <option key={org.id} value={org.id}>
      🏢 {org.name}
    </option>
  ))}
</optgroup>

{/* ✅ GROUP SECTION */}
<optgroup label="Groups">
  {groups.map((g: any) => (
    <option key={g.id} value={`group:${g.id}`}>
      👥 {g.name}
    </option>
  ))}
</optgroup>
</select>
                {hasUnsavedChanges && (
                  <p className="text-xs text-amber-600 mt-1">
                    Save or cancel changes before switching organization
                  </p>
                )}
              </>
            )}
          </div>

          {/* Task Info */}
          <div>
            <div className="text-sm text-gray-500">Task</div>
            <div className="font-medium">{task.name}</div>
            <div className="text-xs text-gray-500">
              Total Effort: <b>{totalTaskHours}h</b>
            </div>
          </div>

          {selectionType === "group" && employees.length > 0 && (
  <div className="flex justify-between items-center mb-2">
    <button
      className="text-xs text-indigo-600 hover:underline"
      onClick={() => {
        const allIds = employees.map((e: any) => e.id);
        setSelected(allIds);

        const nextHours: Record<string, number> = {};
        allIds.forEach((id: string) => {
          const logged = loggedHoursByEmployee[id] || 0;
          nextHours[id] = Math.max(0, logged);
        });

        setHoursByEmployee(nextHours);
      }}
    >
      Select All
    </button>

    <button
      className="text-xs text-gray-500 hover:underline"
      onClick={() => {
        setSelected([]);
        setHoursByEmployee({});
      }}
    >
      Clear
    </button>
  </div>
)}

          {/* Employees List */}
         {(selectionType === "group" || selectedOrgId) ? (
  employeesLoading ? (
    <div className="text-sm text-gray-500">
      {selectionType === "group"
        ? "Loading group members…"
        : "Loading employees…"}
    </div>
  ) : employees.length === 0 ? (
    <div className="text-sm text-gray-500">
      {selectionType === "group"
        ? "No employees found in this group."
        : "No employees found for this organization."}
    </div>
  ) : (
              employees.map((e: any) => {
                const isSelected = selected.includes(e.id);
                const allocated = hoursByEmployee[e.id] ?? 0;
                const logged = loggedHoursByEmployee[e.id] || 0;
                const isBelowMin = allocated < logged;

                return (
                  <div
                    key={e.id}
                    className="flex justify-between items-center border-b py-3 last:border-0"
                  >
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEmployee(e.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          {e.full_name}
                        </div>
                        <div className="text-xs text-gray-500">{e.email}</div>
                      </div>
                    </label>

                    {isSelected && (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={allocated}
                            onChange={(ev) =>
                              updateHours(e.id, ev.target.value)
                            }
                            className={`w-24 px-3 py-2 text-sm text-right border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              isBelowMin
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300"
                            }`}
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-600 font-medium">
                            h
                          </span>
                        </div>
                        {logged > 0 && (
                          <div className="text-xs text-amber-700">
                            Logged:{" "}
                            <span className="font-semibold">{logged}h</span>{" "}
                            (min)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
            <div className="text-sm text-gray-500">
              Please select an organization to view employees.
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 pt-3 border-t text-sm">
            <div>
              Allocated: <b>{totalAllocatedHours}h</b> / {totalTaskHours}h
              {remainingHours > 0 && (
                <span className="text-gray-600">
                  {" • "}Remaining: <b>{remainingHours}h</b>
                </span>
              )}
            </div>
            {hasViolation && (
              <div className="mt-2 text-red-600 font-medium">
                Warning: Some employees have logged hours — allocation cannot be
                reduced below logged amount
              </div>
            )}
            {remainingHours > 0 && (
              <div className="mt-3 text-amber-600 text-sm font-medium text-center">
                {remainingHours} hours remain unassigned.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto px-4 py-3 border-t">
          {hasViolation && (
            <div className="mb-3 text-sm text-red-600 font-medium text-center">
              Warning: Cannot save: Some employees have logged hours exceeding
              allocation
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={`px-6 py-2 rounded text-sm font-medium transition ${
                canSave && !assignEmployeesMutation.isLoading
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!canSave || assignEmployeesMutation.isLoading}
              onClick={save}
            >
              {assignEmployeesMutation.isLoading ? "Saving…" : "Save Changes"}
            </button> 
          </div>
             {totalAllocatedHours > totalTaskHours && (
              <div className="mt-2 text-amber-600 font-medium text-sm text-center">
                ⚠ Overallocated: {totalAllocatedHours}h / {totalTaskHours}h — please adjust.
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default AssigneeDrawer;
