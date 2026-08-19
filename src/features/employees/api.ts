import { api } from '../../lib/axios';

export type Employee = {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  position?: string;
  hire_date?: string; // YYYY-MM-DD
  managed_by?: string | null;
  created_at?: string;
  updated_at?: string;
  employee_number?: string | null; 
  existing_accruals_count?: number;
  accrual_last_resync_doj:string;
};

export type CreateEmployeeInput = Omit<Employee, 'id' | 'created_at' | 'updated_at'>;
export type UpdateEmployeeInput = Partial<
  Omit<Employee, 'organization_id' | 'created_at' | 'updated_at'>
>;

export type EmployeesResponse = {
  employees: Employee[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) => `/organization/${orgId}/hr-management/employees`;
const baseManaged = (orgId: string) => `/organization/${orgId}/hr-management/managed-employees`; // ← NEW




/**
 * listEmployees will try server-side pagination via ?page & ?limit & ?search.
 * If the backend returns a plain array (legacy), it will paginate on the client.
 */
export async function listEmployees(
  orgId: string,
  page: number,
  limit: number,
  search?: string
): Promise<EmployeesResponse> {
  const params: Record<string, any> = { page, limit };
  if (search && search.trim()) params.search = search.trim();

  const { data } = await api.get(base(orgId), { params });

  // Server returns paginated shape
  if (data && data.paginationMetaInfo && Array.isArray(data.client_companies) === false) {
    const employees = data.employees ?? data.list ?? data.data ?? [];
    return {
      employees,
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  // If server returns a raw array → do client-side pagination
  const all: Employee[] = Array.isArray(data) ? data : (data?.employees ?? []);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    employees: paged,
    paginationMetaInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
}

/**
 * List MANAGED employees only
 * Calls: GET /organization/:orgId/employees
 * Protected by: accessOnly(["manager"]) + requirePermission("employees:manager:view")
 * Backend returns only employees managed by the current user
 */
export async function listManagedEmployees(
  orgId: string,
  page: number,
  limit: number,
  search?: string,
  crossOrg?: boolean,
  sort_by?: string,
  sort_order?: "asc" | "desc"
): Promise<EmployeesResponse> {

  // ✅ ONLY CHANGE: added sort_by & sort_order
  const params: Record<string, any> = {
    page,
    limit,
    sort_by,
    sort_order,
  };

  if (search && search.trim()) params.search = search.trim();
  if (crossOrg) params.crossorg = 1;

  const { data } = await api.get(baseManaged(orgId), { params });

  if (data && data.paginationMetaInfo) {
    const employees = data.employees ?? data.list ?? data.data ?? [];
    return {
      employees,
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  const all: Employee[] = Array.isArray(data) ? data : (data?.employees ?? []);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    employees: paged,
    paginationMetaInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
}



 
/**
 * 🔄 List employees across organizations (Cross-org mode)
 * Optionally filter by role (e.g., "manager", "hr", etc.)
 * Example call: listEmployeesCrossOrg(orgId, 1, 10, "John", "manager")
 */
export async function listEmployeesCrossOrg(
  orgId: string,
  page: number,
  limit: number,
  search?: string,
  role?: string // ✅ NEW
): Promise<EmployeesResponse> {
  const params: Record<string, any> = { page, limit };
  if (search && search.trim()) params.search = search.trim();
  if (role) params.role = role; // ✅ add optional role filter

  const { data } = await api.get(`/organization/${orgId}/hr-management/cross-org-employees`, {
    params,
  });

  if (data && data.paginationMetaInfo) {
    const employees = data.employees ?? data.list ?? data.data ?? [];
    return {
      employees,
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  // fallback (in case backend returns array)
  const all: Employee[] = Array.isArray(data) ? data : (data?.employees ?? []);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    employees: paged,
    paginationMetaInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
}

/**
 * 📇 List employees for Active Directory view
 * GET /organization/:orgId/hr-management/cross-org-active-directory-employees
 */
export async function listActiveDirectory(
  orgId: string,
  page: number,
  limit: number,
  search?: string,
  departmentId?: string,
  designationId?: string
): Promise<EmployeesResponse> {
  const params: Record<string, any> = { page, limit };

  if (search && search.trim()) params.search = search.trim();
  if (departmentId) params.department_id = departmentId;
  if (designationId) params.designation_id = designationId;

  // 🧩 Default to "all" if orgId is empty or undefined
  const endpointOrgId = orgId && orgId.trim() !== "" ? orgId : "all";

  const { data } = await api.get(
    `/organization/${endpointOrgId}/hr-management/cross-org-active-directory-employees`,
    { params }
  );

  // ✅ Normalized pagination response
  if (data?.paginationMetaInfo) {
    return {
      employees: data.employees ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  // ✅ Legacy fallback
  const all: Employee[] = Array.isArray(data) ? data : data?.employees ?? [];
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  return {
    employees: paged,
    paginationMetaInfo: {
      totalCount: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / limit)),
      currentPage: page,
      limit,
    },
  };
} 


/**
 * 🕒 Employees visible for Timesheet modules
 * Uses org assignment logic from user_organizations
 */
export async function listEmployeesForTimesheetOrg(
  orgId: string,
  page: number,
  limit: number,
  search?: string,
  role?: string
): Promise<EmployeesResponse> {
  const params: Record<string, any> = { page, limit };

  if (search && search.trim()) {
    params.search = search.trim();
  }

  if (role) {
    params.role = role;
  }

  const { data } = await api.get(
    `/organization/${orgId}/hr-management/timesheet-org-employees`,
    {
      params,
    }
  );

  if (data && data.paginationMetaInfo) {
    const employees = data.employees ?? data.list ?? data.data ?? [];

    return {
      employees,
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  // fallback
  const all: Employee[] = Array.isArray(data)
    ? data
    : (data?.employees ?? []);

  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  return {
    employees: paged,
    paginationMetaInfo: {
      totalCount: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / limit)),
      currentPage: page,
      limit,
    },
  };
}

/**
 * 📤 Export all employees Excel (General + Personal + Employment + Compensation)
 */
export async function exportEmployees(orgId: string) {
  const { data } = await api.get(
    `/organization/${orgId}/employees/export-excel`,
    { responseType: 'blob' }
  );
  return data;
}

export async function listAssignableEmployees(
  orgId: string,
  page: number,
  limit: number,
  search?: string
): Promise<EmployeesResponse> {
  const params: Record<string, any> = { page, limit };

  if (search && search.trim()) {
    params.search = search.trim();
  }

  const { data } = await api.get(
    `/organization/${orgId}/hr-management/employees/assignable`,
    { params }
  );

  if (data?.paginationMetaInfo) {
    return {
      employees: data.employees ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  const all: Employee[] = Array.isArray(data)
    ? data
    : (data?.employees ?? []);

  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  return {
    employees: paged,
    paginationMetaInfo: {
      totalCount: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / limit)),
      currentPage: page,
      limit,
    },
  };
}
/**
 * 📄 List employees eligible for Final Settlement
 * (Inactive / Resigned / Terminated / etc.)
 */
export async function listFinalSettlementEmployees(
  orgId: string,
  page: number,
  limit: number,
  search?: string
): Promise<EmployeesResponse> {
  const params: Record<string, any> = { page, limit };

  if (search && search.trim()) {
    params.search = search.trim();
  }

  const { data } = await api.get(
    `/organization/${orgId}/hr-management/employees/final-settlement`,
    { params }
  );

  if (data?.paginationMetaInfo) {
    return {
      employees: data.employees ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  // Legacy fallback
  const all: Employee[] = Array.isArray(data)
    ? data
    : (data?.employees ?? []);

  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  return {
    employees: paged,
    paginationMetaInfo: {
      totalCount: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / limit)),
      currentPage: page,
      limit,
    },
  };
}

export const employeesApi = {
  
  list: listEmployees,
  listManaged: listManagedEmployees, 
  listCrossOrg: listEmployeesCrossOrg,
  listActiveDirectory: listActiveDirectory, 
  getEmployeesForTimesheetOrg: listEmployeesForTimesheetOrg,
  listAssignable: listAssignableEmployees, 
  listFinalSettlement: listFinalSettlementEmployees,

  get: async (orgId: string, employeeId: string) => {
    const { data } = await api.get(`${base(orgId)}/${employeeId}`);
    return data as Employee;
  },

  create: async (orgId: string, input: CreateEmployeeInput) => {
    const { data } = await api.post(base(orgId), input);
    return data as Employee;
  },

  update: async (orgId: string, employeeId: string, input: UpdateEmployeeInput) => {
    const { data } = await api.patch(`${base(orgId)}/${employeeId}`, input);
    return data as Employee;
  },

  remove: async (orgId: string, employeeIdOrUrl: string) => {
    const { data } = await api.delete(`${base(orgId)}/${employeeIdOrUrl}`);
    console.log('delete employee response:', data);

    if (data?.message && String(data.message).includes('violates foreign key constraint')) {
      throw new Error(data.message);
    }

    return data as { message: string };
  },
  uploadPhoto: async (
    orgId: string,
    employeeId: string,
    file: File,
    opts?: { onProgress?: (percent: number) => void }
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", "profile_photo");

    const { data } = await api.post(`${base(orgId)}/${employeeId}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (!opts?.onProgress || !evt.total) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        opts.onProgress(pct);
      },
    });

    return data as { photo_url: string };
  },
  getPhotoDownloadUrl: async (orgId: string, employeeId: string) => {
  const { data } = await api.get(`${base(orgId)}/${employeeId}/photo/download`
  );
  return data as { url: string };
},
sendPasswordReset: async (orgId: string, employeeId: string) => {
  const { data } = await api.post(
    `/organization/${orgId}/hr-management/employees/${employeeId}/password-reset`
  );
  return data as { message: string };
},
sendOnboardingEmail: async (orgId: string, employeeId: string) => {
  const { data } = await api.post(
    `/organization/${orgId}/hr-management/employees/${employeeId}/send-onboarding-email`
  );
  return data as { message: string };
},
/**
   * 📊 Get total employee count for HR Dashboard
   */
  getEmployeeCount: async (orgId: string) => {
    const { data } = await api.get(`${base(orgId)}/count`);
    return data as { totalEmployees: number ,activeEmployees:number};
  },
  exportEmployees

};
