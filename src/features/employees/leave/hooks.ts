import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  employeeLeaveApi,
  employeeLeaveAccrualApi,
  UpdateEmployeeLeaveInput,
  CreateEmployeeLeaveBody,
} from "./api";
import { useAuth } from "../../auth/AuthProvider";
import { parseApiError } from "../../../utils/parseApiError";
import { emitApiError } from "../../../lib/error-bus";

const keys = {
  list: (orgId: string, employeeId: string, page: number, limit: number, crossOrg?: boolean) =>
    ["employee-leaves", orgId, employeeId, page, limit, crossOrg ? "cross-org" : "same-org"] as const,
  one: (orgId: string, employeeId: string, id: string) =>
    ["employee-leave", orgId, employeeId, id] as const,
  balances: (orgId: string, employeeId: string) =>
    ["employee-leave-balances", orgId, employeeId] as const,
  accruals: (orgId: string, employeeId: string, leaveTypeId: string, year?: number) =>
    ["employee-leave-accruals", orgId, employeeId, leaveTypeId, year] as const,
};

// ────────────────────────────────────────────────
// Fetch leaves
// ────────────────────────────────────────────────
export function useEmployeeLeaves(
  employeeId: string,
  page: number,
  limit: number,
  crossOrg?: boolean // ✅ added optional parameter
) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.list(organization_id, employeeId, page, limit, crossOrg)
      : ["employee-leaves", "no-org", employeeId],
    queryFn: () =>
      employeeLeaveApi.list(organization_id!, employeeId, page, limit, crossOrg), // ✅ forward it
    enabled: !!organization_id && !!employeeId,
  });
}

export function useEmployeeLeave(employeeId: string, leaveId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.one(organization_id, employeeId, leaveId)
      : ["employee-leave", "no-org", employeeId, leaveId],
    queryFn: () => employeeLeaveApi.get(organization_id!, employeeId, leaveId),
    enabled: !!organization_id && !!employeeId && !!leaveId,
  });
}

// ────────────────────────────────────────────────
// Mutations: Create / Update / Delete
// ────────────────────────────────────────────────
export function useCreateEmployeeLeave(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (input: CreateEmployeeLeaveBody) =>
      employeeLeaveApi.create(organization_id!, employeeId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-leaves", organization_id, employeeId] });
      qc.invalidateQueries({ queryKey: ["employee-leave-balances", organization_id, employeeId] });
      qc.invalidateQueries({ queryKey: ["pending-leaves-today", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateEmployeeLeave() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      organization_id,
      employee_id,
      leave_id,
      input,
    }: {
      organization_id: string;
      employee_id: string;
      leave_id: string;
      input: UpdateEmployeeLeaveInput;
    }) => employeeLeaveApi.update(organization_id!, employee_id, leave_id, input),

    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["employee-leaves", organization_id, "all"] });

      qc.invalidateQueries({ queryKey: ["employee-leaves", organization_id, vars.employee_id] });

      qc.invalidateQueries({ queryKey: ["pending-leaves-today", organization_id] });

      qc.invalidateQueries({ queryKey: ["employee-leave", organization_id, vars.employee_id, vars.leave_id] });

      qc.invalidateQueries({ queryKey: ["employee-leave-balances", organization_id, vars.employee_id] });

      qc.invalidateQueries({ queryKey: ["employee-available-leave", organization_id, vars.employee_id], exact: false });

      // ✅ FIX: refresh accrual ledger
      qc.invalidateQueries({ queryKey: ["employee-leave-accruals"], exact: false });

      // ✅ FIX: refresh manager leave matrix
      qc.invalidateQueries({ queryKey: ["leave-matrix"], exact: false });

      // ✅ optional hard refresh
      qc.refetchQueries({ queryKey: ["employee-leave-accruals"], exact: false, type: "active" });

      qc.refetchQueries({ queryKey: ["employee-available-leave"], exact: false, type: "active" });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}
export function useDeleteEmployeeLeave(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (leaveId: string) =>
      employeeLeaveApi.remove(organization_id!, employeeId, leaveId),

    onSuccess: () => {
      // Employee / HR leave lists
      qc.invalidateQueries({ queryKey: ["employee-leaves", organization_id] });

      // Employee balances
      qc.invalidateQueries({
        queryKey: ["employee-leave-balances", organization_id, employeeId],
      });

      // HR dashboard widgets
      qc.invalidateQueries({ queryKey: ["on-leave-today", organization_id] });
      qc.invalidateQueries({ queryKey: ["pending-leaves-today", organization_id] });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

// ────────────────────────────────────────────────
// Balances & Accruals
// ────────────────────────────────────────────────
export function useEmployeeAvailableLeave(
  employeeId: string,
  leaveTypeId: string,
  crossOrg?: boolean // ✅ optional param for cross-org lookup
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id
      ? [
          "employee-available-leave",
          organization_id,
          employeeId,
          leaveTypeId,
          crossOrg ? "cross-org" : "same-org",
        ]
      : ["employee-available-leave", "no-org", employeeId, leaveTypeId],
    queryFn: () =>
      employeeLeaveApi.available(organization_id!, employeeId, leaveTypeId, crossOrg), // ✅ forward flag
    enabled: !!organization_id && !!employeeId && !!leaveTypeId,
  });
}

export function useEmployeeLeaveAccruals(
  employeeId: string,
  leaveTypeId: string,
  crossOrg?: boolean,
  year?: number
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: [
      "employee-leave-accruals",
      organization_id,
      employeeId,
      leaveTypeId,
      year,
      crossOrg ? "cross-org" : "same-org",
    ],

    queryFn: () =>
      employeeLeaveAccrualApi.list(
        organization_id!,
        employeeId,
        leaveTypeId,
        year,
        crossOrg
      ),

    enabled: !!organization_id && !!employeeId && !!leaveTypeId,
  });
}

// ────────────────────────────────────────────────
// Upload leave attachment
// ────────────────────────────────────────────────
export function useUploadLeaveAttachment(employeeId: string, leaveId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (file: File) =>
      employeeLeaveApi.uploadAttachment(organization_id!, employeeId, leaveId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-leaves", organization_id, employeeId] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

// ────────────────────────────────────────────────
// Dashboard: On Leave Today
// ────────────────────────────────────────────────
export function useOnLeaveToday() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["on-leave-today", organization_id],
    queryFn: () => employeeLeaveApi.onLeaveToday(organization_id!),
    enabled: !!organization_id,
  });
}

// ────────────────────────────────────────────────
// Dashboard: All Leave Balances (New)
// ────────────────────────────────────────────────
export function useEmployeeLeaveBalances(employeeId: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id
      ? ["employee-leave-balances", organization_id, employeeId]
      : ["employee-leave-balances", "no-org", employeeId],
    queryFn: () => employeeLeaveApi.balances(organization_id!, employeeId),
    enabled: !!organization_id && !!employeeId,
  });
}

// ────────────────────────────────────────────────
// Preview Leave Attachment (presigned URL for iframe preview)
// ────────────────────────────────────────────────
export function usePreviewLeaveAttachment() {
  const { organization_id, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      leaveId,
      attachmentId,
    }: {
      leaveId: string;
      attachmentId: string;
    }) => {
      return employeeLeaveApi.getAttachmentDownloadUrl(
        organization_id!,
        user?.id!,
        leaveId,
        attachmentId
      );
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

// ────────────────────────────────────────────────
// Dashboard: Pending Leave Approvals Today (HR)
// ────────────────────────────────────────────────
export function usePendingLeavesToday(
  crossOrg?: boolean,
  page: number = 1,
  limit: number = 10,
  all?: boolean
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: [
      "pending-leaves-today",
      organization_id,
      crossOrg ? "cross-org" : "same-org",
      page,
      limit,
      all ? "all" : "paged",
    ],

    queryFn: () =>
      employeeLeaveApi.pendingLeavesToday(
        organization_id!,
        crossOrg,
        page,
        limit,
        all
      ),

    enabled: !!organization_id,
  });
}

export function useMonthlyLeaveMatrix(
  month: string,
  search?: string,
  page: number = 1,
  limit: number = 10,
  crossOrg?: boolean
) {
  const { organization_id } = useAuth();

  const normalizedSearch = (search || "").trim();

return useQuery({
  queryKey: [
    "leave-matrix",
    organization_id,
    month,
    normalizedSearch,
    page,
    limit,
    crossOrg ? "cross-org" : "same-org",
  ],

  queryFn: () =>
    employeeLeaveApi.getMonthlyMatrix(
      organization_id!,
      month,
      normalizedSearch,
      page,
      limit,
      crossOrg
    ),

  enabled: !!organization_id && !!month,

  staleTime: 0,
  gcTime: 0,
});
}

// ────────────────────────────────────────────────
// Export Leave Matrix (Excel)
// ────────────────────────────────────────────────
export function useExportLeaveMatrix() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      month,
      search,
      crossOrg,
    }: {
      month: string;
      search?: string;
      crossOrg?: boolean;
    }) => {
      return employeeLeaveApi.exportLeaveMatrix(
        organization_id!,
        month,
        search,
        crossOrg
      );
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}