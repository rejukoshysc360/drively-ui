import React, { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  FolderOpen,
  Eye,
  Search,
  X,
  Loader2,
  Filter,
  Calendar,
  Clock,
  Hash,
} from "lucide-react";
import {
  useMyAssignedTasks,
  useUpdateAssignmentStatus,
} from "../tasks/hooks";
import { APP_CONFIG } from "../../../src/config/appConfig";
import { useAuth } from "../auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useCan } from "../../utils/permissions";
import TaskViewDetailsDrawer from "./TaskViewDetailsDrawer";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

const TaskList: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState("");
  const [detailsTask, setDetailsTask] = useState<any | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("start_date_asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const updateAssignmentStatus = useUpdateAssignmentStatus();
  const limit = APP_CONFIG.PAGE_SIZE || 10;
  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  const { organization_id } = useAuth();
  const qc = useQueryClient();
  const can = useCan();

  const canView = can("tasks:view") || can("tasks:view_own_record_only");
  const canUpdate = can("tasks:update") || can("tasks:update_own_record_only");

  const { data: myPaginated, isLoading, isFetching } = useMyAssignedTasks(
    page,
    limit,
    debouncedSearch,
    sortBy,
    statusFilter,
    selectedProject
  );

  const assignments = myPaginated?.assignments ?? [];
  const totalPages = myPaginated?.paginationMetaInfo?.totalPages ?? 1;

useEffect(() => {
  if (!assignments.length) {
    setRows([]);
    return;
  }

  const mapped = assignments.map((a: any) => {
    console.log("🔥 assignment.status from backend:", a.status);
    const normalizedStatus = (a.status ?? a.task?.status ?? "todo")
      ?.toLowerCase()
      .replace(/\s+/g, "_");

    return {
      assignment_id: a.assignment_id,
      id: a.task?.id,
      parent_id: a.task?.parent_id,
      name: a.task?.name,
      description: a.task?.description ?? "",
      status: normalizedStatus, // ✅ unified
      priority: a.task?.priority,
      start_date: a.task?.start_date,
      end_date: a.task?.end_date,
      hours: a.task?.hours ?? null,
      project_id: a.project?.id,
      project_name: a.project?.name,
      project_code: a.project?.code,
      hierarchy: a.hierarchy,
      isAssigned: a.task?.isAssigned ?? false,
    };
  });

  console.log(
    "✅ mapped rows:",
    mapped.map((m) => ({ id: m.id, status: m.status }))
  );

  setRows(mapped);
}, [assignments]);


  useEffect(() => {
    if (assignments.length) {
      const map = new Map(allProjects.map((p) => [p.id, p]));
      assignments.forEach((a: any) => {
        if (a.project?.id && !map.has(a.project.id)) {
          map.set(a.project.id, {
            id: a.project.id,
            code: a.project.code,
            name: a.project.name,
          });
        }
      });
      setAllProjects(Array.from(map.values()));
    }
  }, [assignments]);

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    todo: { label: "To Do", bg: "bg-yellow-100", text: "text-yellow-800" },
    in_progress: { label: "In Progress", bg: "bg-blue-100", text: "text-blue-800" },
    done: { label: "Done", bg: "bg-green-100", text: "text-green-800" },
    blocked: { label: "Blocked", bg: "bg-red-100", text: "text-red-800" },
  };
  const normalized = status?.toLowerCase().replace(/\s+/g, "_");
  const fallback = { label: status || "Unknown", bg: "bg-gray-100", text: "text-gray-700" };
  const { label, bg, text } = map[normalized] || fallback;
  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};


  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const visibleRows = useMemo(() => {
    const isVisible = (row: any) => {
      if (!row.hierarchy?.parents?.length) return true;
      return row.hierarchy.parents.every((p: any) => expanded[p.id]);
    };
    return rows.filter(isVisible);
  }, [rows, expanded]);

  // ✅ Only update the selected task status
const updateStatus = async (assignmentId: string, taskId: string, newStatus: string) => {
  if (!canUpdate) return;

  setRows(prev =>
    prev.map(r => {
      const isSameAssignment = r.assignment_id === assignmentId;
      const isSelfOrChild =
        r.id === taskId ||
        (r.hierarchy?.parents || []).some(p => p.id === taskId);
      return isSameAssignment && isSelfOrChild
        ? { ...r, status: newStatus }
        : r;
    })
  );

  try {
    await updateAssignmentStatus.mutateAsync({
      assignmentId,
      taskId,
      status: newStatus,
    });
  } catch {
    qc.invalidateQueries({ queryKey: ["my-assigned-tasks", organization_id] });
  }
};


  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-indigo-600" />
          My Tasks
        </h1>
        <p className="text-slate-600 mt-1">
          View and manage all your assigned tasks
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Search box */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-xs w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isFetching && !isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-600" />
              )}
            </div>

            {/* Project & Status Filters */}
            <div className="flex flex-col sm:flex-row flex-1 gap-3 sm:gap-4 w-full sm:w-auto">
              <select
                className="flex-1 min-w-[180px] px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Projects</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.code} – ${p.name}` : p.name}
                  </option>
                ))}
              </select>

              <select
                className="flex-1 min-w-[150px] px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Status</option>
                {["todo", "in_progress", "done", "blocked"].map((s) => (
                  <option key={s} value={s}>
                    {getStatusBadge(s).props.children}
                  </option>
                ))}
              </select>

              <select
                className="flex-1 min-w-[180px] px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                <option value="start_date_asc">Start Date (Oldest)</option>
                <option value="start_date_desc">Start Date (Newest)</option>
                <option value="end_date_asc">Due Date (Soonest)</option>
                <option value="end_date_desc">Due Date (Latest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading & Empty States */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-lg p-6 animate-pulse border border-gray-200"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : visibleRows.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Filter className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Try adjusting your filters or search term.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="block md:hidden space-y-5">
              {visibleRows.map((row) => {
                const depth = row.hierarchy?.parents?.length || 0;
                const hasChildren = rows.some((r) => r.parent_id === row.id);
                const isExpanded = expanded[row.id];
                return (
                  <div
                    key={row.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 transition hover:shadow-md"
                    style={{ marginLeft: `${depth * 16}px` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {hasChildren && (
                          <button
                            onClick={() => toggleExpand(row.id)}
                            className="mt-1 text-gray-500 hover:text-indigo-600 flex-shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base break-words">
                            {row.name}
                          </h3>
                          {row.project_code && (
                            <div className="mt-1 text-xs text-gray-500 break-words leading-snug">
                              <div className="flex items-start gap-1 flex-wrap">
                                <span className="font-medium break-words">
                                  {row.project_code}
                                  {row.project_name ? (
                                    <>
                                      {" "}
                                      <span className="text-gray-400">—</span>{" "}
                                      <span className="text-gray-500">
                                        {row.project_name}
                                      </span>
                                    </>
                                  ) : null}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                     {canUpdate && row.isAssigned && ( 

                        <select
                          value={row.status}
                          onChange={(e) =>
                            updateStatus(
                              row.assignment_id,
                              row.id,
                              e.target.value
                            )
                          }
                          disabled={!canUpdate}
                          className="text-xs border border-gray-300 rounded-full px-3 py-1.5 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                        >
                          {APP_CONFIG.STATUS_OPTIONS_SUB.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 text-sm text-gray-700 mt-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>
                          {row.start_date
                            ? dayjs(row.start_date).format("MMM D, YYYY")
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>
                          {row.end_date
                            ? dayjs(row.end_date).format("MMM D, YYYY")
                            : "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 flex-wrap gap-y-2">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Hours:</span>{" "}
                          {row.hours ?? "—"}
                        </div>
                        <div>{getStatusBadge(row.status)}</div>
                      </div>
                    </div>

                    {canView && (
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => setDetailsTask(row)}
                          className="p-2 rounded-full hover:bg-gray-100 transition"
                        >
                          <Eye className="w-5 h-5 text-indigo-600" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:grid grid-cols-12 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200 pb-3 mb-4">
              <div className="col-span-4">Task</div>
              <div className="col-span-2">Start Date</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-1">Hours</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right pr-4">Actions</div>
            </div>

            {visibleRows.map((row) => {
              const depth = row.hierarchy?.parents?.length || 0;
              const indent = Math.min(depth * 20, 80);
              const hasChildren = rows.some((r) => r.parent_id === row.id);
              const isExpanded = expanded[row.id];
              return (
                <div key={row.id}>
                  <div
                    className="hidden md:grid grid-cols-12 items-center py-4 border-b border-gray-100 hover:bg-indigo-50/30 transition-colors"
                    style={{ paddingLeft: `${indent}px` }}
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      {hasChildren && (
                        <button
                          onClick={() => toggleExpand(row.id)}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <span
                        className={`font-medium ${
                          depth === 0 ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {row.name}
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-gray-700">
                      {row.start_date
                        ? dayjs(row.start_date).format("MMM D, YYYY")
                        : "—"}
                    </div>
                    <div className="col-span-2 text-sm text-gray-700">
                      {row.end_date
                        ? dayjs(row.end_date).format("MMM D, YYYY")
                        : "—"}
                    </div>
                    <div className="col-span-1 text-sm text-gray-700">
                      {row.hours ? `${row.hours}h` : "—"}
                    </div>
                    <div className="col-span-2">
                     {row.isAssigned && (
                        <select
                          disabled={!canUpdate}
                          value={row.status}
                          onChange={(e) =>
                            updateStatus(
                              row.assignment_id,
                              row.id,
                              e.target.value
                            )
                          }
                          className="text-sm bg-transparent border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 w-full"
                        >
                          {APP_CONFIG.STATUS_OPTIONS_SUB.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="col-span-1 text-right">
                      {canView && (
                        <button
                          onClick={() => setDetailsTask(row)}
                          className="text-indigo-600 hover:text-indigo-800 p-2"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page <span className="text-indigo-600 font-bold">{page}</span>{" "}
                of{" "}
                <span className="text-indigo-600 font-bold">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isFetching}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailsTask && (
        <TaskViewDetailsDrawer
          task={detailsTask}
          onClose={() => setDetailsTask(null)}
        />
      )}
    </div>
  );
};

export default TaskList;
