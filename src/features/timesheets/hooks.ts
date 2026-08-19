import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { timesheetsApi, timesheetEntriesApi } from "./api";
import { useAuth } from "../auth/AuthProvider";
import { parseApiError } from "../../utils/parseApiError";
import { emitApiError } from "../../lib/error-bus";

/* ----------------------------------
   🔑 Query Keys
---------------------------------- */
const keys = {
  list: (orgId: string, page: number, limit: number, search?: string, from?: string, to?: string) =>
    ["timesheets", orgId, page, limit, search ?? "", from ?? "", to ?? ""] as const,
  one: (orgId: string, id: string) => ["timesheets", orgId, id] as const,
  byProject: (orgId: string, projectId: string) => ["timesheets", orgId, "project", projectId] as const,
  assignments: (orgId: string) => ["assignments", orgId] as const,
  byWeek: (orgId: string, from: string, to: string) => ["timesheets", orgId, "week", from, to] as const,
  myProjects: (orgId: string) => ["my-projects", orgId] as const,
};

const entryKeys = {
  list: (orgId: string, timesheetId: string) => ["timesheetEntries", orgId, timesheetId] as const,
  one: (orgId: string, timesheetId: string, entryId: string) =>
    ["timesheetEntries", orgId, timesheetId, entryId] as const,
};

/* ----------------------------------
   🔹 Timesheets CRUD
---------------------------------- */

// 📄 Paginated list (HR/Admin)
export function useTimesheets(page: number, limit: number, search?: string, from?: string, to?: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.list(organization_id, page, limit, search, from, to) : ["timesheets", "no-org"],
    queryFn: () => timesheetsApi.list(organization_id!, page, limit, search, from, to),
    enabled: !!organization_id,
    keepPreviousData: true,
  });
}

// 📄 Single timesheet
export function useTimesheet(id: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.one(organization_id, id) : ["timesheets", "no-org", id],
    queryFn: () => timesheetsApi.get(organization_id!, id),
    enabled: !!organization_id && !!id,
  });
}

// 🟢 Create
export function useCreateTimesheet() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: any) => timesheetsApi.create(organization_id!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timesheets", organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

// 🟡 Update
export function useUpdateTimesheet() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: any) =>
      timesheetsApi.update(organization_id!, input.id, input),
    onSuccess: (_, input) => {
      // invalidate all week-based timesheet queries so UI refreshes
      qc.invalidateQueries({ queryKey: ["timesheets", organization_id] });
      // optional: target narrower key if known
      // qc.invalidateQueries({ queryKey: keys.byWeek(organization_id, input.from, input.to) });
    },
  });
}



// 🔴 Delete
export function useDeleteTimesheet() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (id: string) => timesheetsApi.remove(organization_id!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timesheets", organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/* ----------------------------------
   🔹 Assignments (Employee)
---------------------------------- */
export function useMyAssignments() {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.assignments(organization_id) : ["assignments", "no-org"],
    queryFn: () => timesheetsApi.getMyAssignments(organization_id!),
    enabled: !!organization_id,
  });
}

/* ----------------------------------
   🔹 Timesheets by Project
---------------------------------- */
export function useTimesheetsByProject(projectId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey:
      organization_id && projectId
        ? keys.byProject(organization_id, projectId)
        : ["timesheets", "no-org", "project", projectId],
    queryFn: () => timesheetsApi.getByProject(organization_id!, projectId),
    enabled: !!organization_id && !!projectId,
  });
}

export function useBulkUpsertTimesheets(projectId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (timesheets: any[]) => timesheetsApi.bulkUpsert(organization_id!, projectId, timesheets),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.byProject(organization_id!, projectId) });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/* ----------------------------------
   🔹 Timesheet Entries (Tasks)
---------------------------------- */
export function useTimesheetEntries(timesheetId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id && timesheetId ? entryKeys.list(organization_id, timesheetId) : ["entries", "no-org"],
    queryFn: () => timesheetEntriesApi.list(organization_id!, timesheetId),
    enabled: !!organization_id && !!timesheetId,
  });
}

export function useCreateTimesheetEntry(timesheetId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: any) => timesheetEntriesApi.create(organization_id!, timesheetId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: entryKeys.list(organization_id!, timesheetId) }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateTimesheetEntry(timesheetId: string, entryId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: any) => timesheetEntriesApi.update(organization_id!, timesheetId, entryId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: entryKeys.list(organization_id!, timesheetId) });
      qc.invalidateQueries({ queryKey: entryKeys.one(organization_id!, timesheetId, entryId) });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteTimesheetEntry() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: ({ timesheetId, entryId }: { timesheetId: string; entryId: string }) =>
      timesheetEntriesApi.remove(organization_id!, timesheetId, entryId),
    onSuccess: (_, { timesheetId }) => qc.invalidateQueries({ queryKey: entryKeys.list(organization_id!, timesheetId) }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/* ----------------------------------
   🔹 Employee Timesheet (Self)
---------------------------------- */
// ✅ Renamed from useAllTimesheets
export function useTimesheetsForMyself(weekStart: string, weekEnd: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.byWeek(organization_id, weekStart, weekEnd) : ["timesheets", "no-org"],
    queryFn: () => timesheetsApi.getAllForMyself(organization_id!, weekStart, weekEnd),
    enabled: !!organization_id && !!weekStart && !!weekEnd,
    staleTime: 60 * 1000,
  });
}

/* ✅ Alias for backward compatibility */
export const useAllTimesheets = useTimesheetsForMyself;

/* ----------------------------------
   🔹 Bulk Upsert (All Projects)
---------------------------------- */
export function useBulkUpsertTimesheetsAll() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (timesheets: any[]) => timesheetsApi.bulkUpsertAll(organization_id!, timesheets),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timesheets", organization_id, "all"] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/* ----------------------------------
   🔹 Timesheets by Employee + Month (HR Summary)
---------------------------------- */
export function useTimesheetsByEmployeeAndMonth(employeeId: string, year: number, month: number) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: ["timesheets", organization_id, "employee", employeeId, "month", year, month],
    queryFn: () => timesheetsApi.getByEmployeeAndMonth(organization_id!, employeeId, year, month),
    enabled: !!organization_id && !!employeeId && !!year && !!month,
    staleTime: 60 * 1000, // cache for 1 minute
  });
}

export function useExportTimesheetsByEmployeeAndMonth() {
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: async ({
      employeeId,
      from,
      to,
    }: { employeeId: string; from: string; to: string }) => {
      if (!organization_id) throw new Error("Missing organization ID");
      return await timesheetsApi.exportByEmployeeAndMonth(
        organization_id,
        employeeId,
        from,
        to
      );
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useEmployeeAssignments(employeeId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: ['assignments', organization_id, employeeId],
    queryFn: () => timesheetsApi.getAssignmentsByEmployee(organization_id!, employeeId),
    enabled: !!organization_id && !!employeeId,
  });
}

// 🟣 Update (HR modal – with entries array)
export function useUpdateTimesheetWithEntries() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (input: any) =>
      timesheetsApi.updateWithEntries(organization_id!, input.id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["timesheets", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function usePendingTimesheetSummary() {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: ["pending-timesheets", organization_id],
    queryFn: () => timesheetsApi.getPendingSummary(organization_id!),
    enabled: !!organization_id,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useMyProjects() {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.myProjects(organization_id) : ["my-projects", "no-org"],
    queryFn: () => timesheetsApi.getMyProjects(organization_id!),
    enabled: !!organization_id,
    staleTime: 60 * 1000, // 1 minute cache
  });
}

// In ../../../../features/timesheets/hooks (or wherever useTaskProgress is defined)
export function useTaskProgress(projectId: string, taskId: string) {
  const { organization_id } = useAuth();

  // Add debug log — remove later
  console.log("useTaskProgress params:", { organization_id, projectId, taskId });

  return useQuery({
    queryKey: ["task-progress", organization_id, projectId, taskId],
    queryFn: () => timesheetsApi.getTaskProgress(organization_id!, projectId, taskId),
    enabled: !!organization_id && !!projectId && !!taskId,  // Keep this
    retry: 1,
    staleTime: 5 * 60 * 1000, // optional: cache for 5 mins
  });
}

export function useActivitySuggestions(
  search: string,
  projectId?: string
) {
  const { organization_id } = useAuth();

  const trimmed = search?.trim();

  return useQuery({
    queryKey: [
      "activity-suggestions",
      organization_id,
      trimmed,
      projectId,
    ],
    queryFn: async () => {
      if (!organization_id || !trimmed) return [];

      return timesheetsApi.getActivitySuggestions(
        organization_id,
        trimmed,
        projectId
      );
    },
    enabled: !!organization_id && trimmed.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}
