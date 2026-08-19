// src/pages/employees/hooks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesApi, CreateEmployeeInput, UpdateEmployeeInput } from './api';
import { useAuth } from '../auth/AuthProvider';
import { parseApiError } from '../../utils/parseApiError';
import { emitApiError } from '../../lib/error-bus';
import { emitSuccess } from '../../lib/success-bus';
import dayjs from 'dayjs';

const keys = {

  list: (orgId: string, page: number, limit: number, search?: string) =>
    ['employees', orgId, page, limit, search ?? ''] as const,
  // For manager-only list (current /employees endpoint)
  managedList: (orgId: string, page: number, limit: number, search?: string) =>
    ['employees', 'managed', orgId, page, limit, search ?? ''] as const,

  // For future full list (Admin/HR) – optional, keep for forward compatibility
  fullList: (orgId: string, page: number, limit: number, search?: string) =>
    ['employees', 'full', orgId, page, limit, search ?? ''] as const,

  one: (orgId: string, id: string) => ['employees', orgId, id] as const,

  // Generic base for invalidation
  base: (orgId: string) => ['employees', orgId] as const,
};

// PRIMARY HOOK: Use this in EmployeesList.tsx
export function useManagedEmployees(
  page: number,
  limit: number,
  search?: string,
  opts?: {
    crossOrg?: boolean;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id
      ? [
          'employees',
          'managed',
          organization_id,
          page,
          limit,
          search ?? '',
          opts?.crossOrg ? 'cross-org' : 'same-org',
          opts?.sort_by || 'created_at',
          opts?.sort_order || 'desc',
        ]
      : ['managed-employees', 'no-org'],

    queryFn: () =>
      employeesApi.listManaged(
        organization_id!,
        page,
        limit,
        search,
        opts?.crossOrg,
        opts?.sort_by,
        opts?.sort_order
      ),

    enabled: !!organization_id,
  });
}
export function useEmployees(page: number, limit: number, search?: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.list(organization_id, page, limit, search) : ['employees', 'no-org'],
    queryFn: () => employeesApi.list(organization_id!, page, limit, search),
    enabled: !!organization_id,
  });
}

export function useEmployeesCrossOrg(page: number, limit: number, search?: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? ['employees', 'cross-org', organization_id, page, limit, search ?? '']
      : ['employees', 'cross-org', 'no-org'],
    queryFn: () => employeesApi.listCrossOrg(organization_id!, page, limit, search),
    enabled: !!organization_id,
  });
}

export function useEmployeesCrossOrgByRole(
  page: number,
  limit: number,
  search?: string,
  role?: string
) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? ['employees', 'cross-org', 'role', role ?? 'all', organization_id, page, limit, search ?? '']
      : ['employees', 'cross-org', 'role', 'no-org'],
    queryFn: () => employeesApi.listCrossOrg(organization_id!, page, limit, search, role),
    enabled: !!organization_id && !!role,
  });
}

export function useEmployeesForTimesheetOrg(
  page: number,
  limit: number,
  search?: string,
  role?: string
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id
      ? [
          "employees",
          "timesheet-org",
          "role",
          role ?? "all",
          organization_id,
          page,
          limit,
          search ?? "",
        ]
      : ["employees", "timesheet-org", "no-org"],

    queryFn: () =>
      employeesApi.getEmployeesForTimesheetOrg(
        organization_id!,
        page,
        limit,
        search,
        role
      ),

    enabled: !!organization_id,
  });
}



export function useEmployee(employeeId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.one(organization_id, employeeId) : ['employee', 'no-org', employeeId],
    queryFn: () => employeesApi.get(organization_id!, employeeId),
    enabled: !!organization_id && !!employeeId,
  });
}

export function useEmployeesbyOrgId(page: number, limit: number, organizationId?: string) {
  const { organization_id: authOrgId } = useAuth();
  const orgId = organizationId || authOrgId;

  return useQuery({
    queryKey: orgId ? keys.list(orgId, page, limit) : ["employees", "no-org"],
    queryFn: () => employeesApi.list(orgId!, page, limit),
    enabled: !!orgId,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => employeesApi.create(organization_id!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.base(organization_id!) });
      qc.invalidateQueries({ queryKey: ['employees', 'managed', organization_id!] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateEmployee(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => employeesApi.update(organization_id!, employeeId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.base(organization_id!) });
      qc.invalidateQueries({ queryKey: ['employees', 'managed', organization_id!] });
      qc.invalidateQueries({ queryKey: keys.one(organization_id!, employeeId) });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      employeeId,
      force,
      table,
    }: {
      employeeId: string;
      force?: boolean;
      table?: string;
    }) => {
      const url = force
        ? `${employeeId}?force=true${table ? `&table=${table}` : ''}`
        : employeeId;

      const res = await employeesApi.remove(organization_id!, url);

      if (res?.message?.includes('violates foreign key constraint')) {
        throw new Error(res.message);
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.base(organization_id!) });
      qc.invalidateQueries({ queryKey: ['employees', 'managed', organization_id!] });
    },
  });
}

// Rest of hooks unchanged (uploadPhoto, photoUrl, password reset, count)
export function useUploadEmployeePhoto(employeeId: string) {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (args: { file: File; onProgress?: (p: number) => void }) =>
      employeesApi.uploadPhoto(organization_id!, employeeId, args.file, {
        onProgress: args.onProgress,
      }),
    onSuccess: () => {
      emitSuccess({ message: "Profile photo uploaded successfully", type: "success" }); 
      qc.invalidateQueries({ queryKey: keys.one(organization_id!, employeeId) });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useEmployeePhotoUrl(employeeId: string) {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: () => employeesApi.getPhotoDownloadUrl(organization_id!, employeeId),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useSendPasswordReset() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: string) =>
      employeesApi.sendPasswordReset(organization_id!, employeeId),
    onSuccess: () => {
      emitSuccess({ message: "Password reset email sent successfully", type: "success" });
      qc.invalidateQueries({ queryKey: keys.base(organization_id!) });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useEmployeeCount() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["employeeCount", organization_id],
    queryFn: () => employeesApi.getEmployeeCount(organization_id!),
    enabled: !!organization_id,
  });
}

export function useSendOnboardingEmail() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (employeeId: string) =>
      employeesApi.sendOnboardingEmail(organization_id!, employeeId),
    onSuccess: () => emitSuccess({ message: "Onboarding email sent successfully", type: "success" }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}


 
// 🧾 Export Employees Excel (valid .xlsx fix)
export function useExportEmployees() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const buffer = await employeesApi.exportEmployees(organization_id!);
      return new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    },
    onSuccess: (blob) => {
      const fileName = `Employees_${dayjs().format("YYYY-MM-DD_HH-mm")}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      emitSuccess({
        message: "Employee Excel exported successfully",
        type: "success",
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * 🧩 Fetch employees for Active Directory view
 * Supports pagination + optional filters
 */
export function useEmployeesActiveDirectory(
  page: number,
  limit: number,
  search?: string,
  organizationId?: string,
  departmentId?: string,
  designationId?: string
) {
  const { organization_id } = useAuth();

  const effectiveOrganizationId = organizationId || organization_id;

return useQuery({
  queryKey: [
    "employees",
    "active-directory",
    effectiveOrganizationId,
    page,
    limit,
    search ?? "",
    departmentId ?? "",
    designationId ?? "",
  ],

  queryFn: () =>
    employeesApi.listActiveDirectory(
      effectiveOrganizationId!,
      page,
      limit,
      search,
      departmentId,
      designationId
    ),

  enabled: !!effectiveOrganizationId,
});
}

export function useAssignableEmployeesByOrgId(
  page: number,
  limit: number,
  organizationId?: string,
  search?: string
) {
  const { organization_id: authOrgId } = useAuth();

  const orgId = organizationId || authOrgId;

  return useQuery({
    queryKey: [
      "employees",
      "assignable",
      orgId,
      page,
      limit,
      search ?? "",
    ],

    queryFn: () =>
      employeesApi.listAssignable(
        orgId!,
        page,
        limit,
        search
      ),

    enabled: !!orgId,
  });
}

export function useFinalSettlementEmployees(
  page: number,
  limit: number,
  search?: string
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: [
      "employees",
      "final-settlement",
      organization_id,
      page,
      limit,
      search ?? "",
    ],
    queryFn: () =>
      employeesApi.listFinalSettlement(
        organization_id!,
        page,
        limit,
        search
      ),
    enabled: !!organization_id,
  });
}