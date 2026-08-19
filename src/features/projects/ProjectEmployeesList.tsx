import { useState } from "react";
import { useAllAssignments, useDeleteAssignment } from "./hooks";
import { useNavigate, useParams } from "react-router-dom";
import {
  UserMinus,
  ArrowLeft,
  Mail,
  Clock,
  ClipboardList,
} from "lucide-react";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { getAssignmentStatusColor } from "../../utils/StatusColorBadge";

type Assignment = {
  assignment_id: string;
  project_id: string;
  assigned_hours: number;
  notes?: string | null;
  assigned_at?: string;
  status?: string;
  task?: {
    id: string;
    name: string;
    description?: string | null;
    status?: string | null;
    priority?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    estimated_hours?: number | null;
    created_at?: string | null;
    planned_duration_days?: number | null;
    expected_deadline?: string | null;
    submission_status?: string | null;
    approval_date?: string | null;
  };
};

type EmployeeAssignments = {
  employee: {
    id: string;
    full_name: string;
    email: string;
    position?: string | null;
  };
  assignments: Assignment[];
};

export default function ProjectAssignmentsList() {
  const nav = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isLoading } = useAllAssignments(projectId!);
  const del = useDeleteAssignment();

  const [unassignTarget, setUnassignTarget] = useState<{
    assignment_id: string;
    full_name: string;
  } | null>(null);

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    {}
  );
  const toggleExpanded = (id: string) =>
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));

  const rows = (data ?? []) as EmployeeAssignments[];

  const getPriorityColor = (priority?: string | null) => {
    const p = (priority || "").toLowerCase();
    const map: Record<string, string> = {
      low: "bg-emerald-100 text-emerald-700 border-emerald-200",
      medium: "bg-amber-100 text-amber-700 border-amber-200",
      high: "bg-red-100 text-red-700 border-red-200",
    };
    return map[p] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getSubmissionColor = (status?: string | null) => {
    const s = (status || "").toLowerCase();
    const map: Record<string, string> = {
      not_started: "bg-gray-100 text-gray-600 border-gray-200",
      in_progress: "bg-amber-100 text-amber-700 border-amber-200",
      submitted: "bg-indigo-100 text-indigo-700 border-indigo-200",
      approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };
    return map[s] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  if (isLoading)
    return (
      <div className="p-6 text-gray-500 animate-pulse">
        Loading project assignments…
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
          Project Assignments
        </h1>
        <button
          onClick={() => nav("/projects")}
          className="mt-2 sm:mt-0 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
      </div>

      {/* Empty State */}
      {!isLoading && rows.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-500">
            No assignments found for this project.
          </div>
        </div>
      )}

      {/* --- MOBILE VIEW --- */}
      <div className="block lg:hidden space-y-6">
        {rows.map(({ employee, assignments }) => (
          <div
            key={employee.id}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            {/* Employee Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{employee.full_name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {employee.email}
                </p>
                {employee.position && (
                  <p className="text-xs text-gray-500 mt-1">
                    {employee.position}
                  </p>
                )}
              </div>
              <span className="text-xs font-medium text-gray-400">
                {assignments.length}{" "}
                {assignments.length > 1 ? "tasks" : "task"}
              </span>
            </div>

            {/* Assigned Tasks */}
            <div className="space-y-4">
              {assignments.map((a) => (
                <div
                  key={a.assignment_id}
                  className="border border-gray-100 rounded-lg p-3 bg-white shadow-sm"
                >
                  {/* Task Title */}
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-sm text-slate-700 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-indigo-600" />
                      {a.task?.name || "Unnamed Task"}
                    </p>
                    <div className="flex items-center gap-2">
                      {a.task?.priority && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getPriorityColor(
                            a.task.priority
                          )}`}
                        >
                          {a.task.priority}
                        </span>
                      )}
                      {a.status && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getAssignmentStatusColor(
                            a.status
                          )}`}
                        >
                          {a.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand/Collapse Task Details */}
                  <button
                    onClick={() => toggleExpanded(a.assignment_id)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2"
                  >
                    {expandedTasks[a.assignment_id]
                      ? "Hide Task Details ▲"
                      : "Show Task Details ▼"}
                  </button>

                  {expandedTasks[a.assignment_id] && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-xs text-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1">
                        <p>
                          Status:{" "}
                          <span className="font-medium">
                            {a.task?.status || "N/A"}
                          </span>
                        </p>
                       <p>
                        Estimated Hours: {a.task?.estimated_hours ?? "—"} hrs
                      </p>
                          <p>
                          Deadline:{" "}
                          {a.task?.expected_deadline
                            ? new Date(
                                a.task.expected_deadline
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                        <p>
                          Submission:{" "}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full border ${getSubmissionColor(
                              a.task?.submission_status
                            )}`}
                          >
                            {a.task?.submission_status || "not_started"}
                          </span>
                        </p>
                        <p>
                          Approval:{" "}
                          {a.task?.approval_date
                            ? new Date(
                                a.task.approval_date
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                        <p>
                          Created:{" "}
                          {a.task?.created_at
                            ? new Date(
                                a.task.created_at
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hours & Notes */}
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>
                      <strong>Assigned Hours:</strong>{" "}
                      {a.assigned_hours ?? a.task?.estimated_hours ?? "-"}
                    </span>
                  </div>

                  {a.notes && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      “{a.notes}”
                    </p>
                  )}

                  {/* Unassign Button */}
                  <button
                    onClick={() =>
                      setUnassignTarget({
                        assignment_id: a.assignment_id,
                        full_name: employee.full_name,
                      })
                    }
                    className="w-full mt-3 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <UserMinus className="w-4 h-4" />
                    Unassign
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP VIEW --- */}
      <div className="hidden lg:block space-y-8">
        {rows.map(({ employee, assignments }) => (
          <div
            key={employee.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-semibold text-lg text-slate-800">
                  {employee.full_name}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {employee.email}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {assignments.length}{" "}
                {assignments.length > 1 ? "tasks" : "task"}
              </div>
            </div>

            <div className="divide-y">
              {assignments.map((a) => (
                <div
                  key={a.assignment_id}
                  className="flex flex-col gap-2 px-5 py-3 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {a.task?.name || "Unnamed Task"}
                      </span>
                      {a.task?.priority && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getPriorityColor(
                            a.task.priority
                          )}`}
                        >
                          {a.task.priority}
                        </span>
                      )}
                      {a.status && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getAssignmentStatusColor(
                            a.status
                          )}`}
                        >
                          {a.status}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      <Clock className="w-4 h-4 inline mr-1 text-indigo-600" />
                      {a.assigned_hours ?? a.task?.estimated_hours ?? "-"} hrs
                    </div>
                  </div>

                  {/* Expand/Collapse Task Details */}
                  <button
                    onClick={() => toggleExpanded(a.assignment_id)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2 self-start"
                  >
                    {expandedTasks[a.assignment_id]
                      ? "Hide Details ▲"
                      : "Show Details ▼"}
                  </button>

                  {expandedTasks[a.assignment_id] && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-gray-700">
                      <div className="grid grid-cols-2 gap-y-1 gap-x-4">
                        <p>
                          Status:{" "}
                          <span className="font-medium">
                            {a.task?.status || "N/A"}
                          </span>
                        </p>
                      <p>
                        Estimated Hours: {a.task?.estimated_hours ?? "—"} hrs
                      </p>
                        <p>
                          Deadline:{" "}
                          {a.task?.expected_deadline
                            ? new Date(
                                a.task.expected_deadline
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                        <p>
                          Submission:{" "}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full border ${getSubmissionColor(
                              a.task?.submission_status
                            )}`}
                          >
                            {a.task?.submission_status || "not_started"}
                          </span>
                        </p>
                        <p>
                          Approval:{" "}
                          {a.task?.approval_date
                            ? new Date(
                                a.task.approval_date
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                        <p>
                          Created:{" "}
                          {a.task?.created_at
                            ? new Date(
                                a.task.created_at
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  {a.notes && (
                    <p className="text-xs text-gray-600 italic mt-1">
                      “{a.notes}”
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        setUnassignTarget({
                          assignment_id: a.assignment_id,
                          full_name: employee.full_name,
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-300 text-sm text-red-600 hover:bg-red-50"
                    >
                      <UserMinus className="w-4 h-4" />
                      Unassign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!unassignTarget}
        title="Unassign employee?"
        description={
          unassignTarget
            ? `Are you sure you want to unassign "${unassignTarget.full_name}" from this task?`
            : undefined
        }
        confirmLabel="Unassign"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (unassignTarget) {
            del.mutate(unassignTarget.assignment_id);
            setUnassignTarget(null);
          }
        }}
        onClose={() => setUnassignTarget(null)}
        isLoading={del.isPending}
        danger
      />
    </div>
  );
}
