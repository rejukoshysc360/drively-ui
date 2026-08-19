import { api } from '../../lib/axios';

export type Project = {
  id: string;
  organization_id: string;
  client_company_id?: string | null;
  name: string;
  code?: string | null;

  // 🆕 New fields from sheet
  project_reference?: string | null;
  loa_signed_date?: string | null; // YYYY-MM-DD
  actual_duration?: number | null;
  approval_date?: string | null; // YYYY-MM-DD
  priority?: 'high' | 'low' | null;
  client_lead_consultant?: string | null;
  tasks?: string | null;
  duration_as_per_loa?: number | null;
  expected_deadline?: string | null; // YYYY-MM-DD
  status_of_submission?: 'submitted' | 'in_progress' | 'not_started' | null;

  // 🧾 Existing fields
  billing_type?: 'time_and_materials' | 'fixed_fee' | string | null;
  fixed_fee_amount?: number | null;
  currency?: string | null;
  start_date?: string | null;   // YYYY-MM-DD
  end_date?: string | null;     // YYYY-MM-DD
  status?: 'active' | 'paused' | 'completed' | string | null;
  notes?: string | null;
  terms?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProjectsResponse = {
  projects: Project[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) => `/organization/${orgId}/hr-management/projects`;

export async function listProjects(
  orgId: string,
  page: number,
  limit: number,
  search?: string,
  from?: string,
  to?: string,
  sort_by?: string,
  sort_order?: 'asc' | 'desc'
): Promise<ProjectsResponse> {
  const params: Record<string, any> = { page, limit };

  if (search && search.trim()) params.search = search.trim();
  if (from) params.from = from;
  if (to) params.to = to;

  // ✅ NEW
  if (sort_by) params.sort_by = sort_by;
  if (sort_order) params.sort_order = sort_order;

  const { data } = await api.get(`/organization/${orgId}/hr-management/projects`, { params });

  if (data && data.paginationMetaInfo) {
    const projects = data.projects ?? data.list ?? data.data ?? [];
    return { projects, paginationMetaInfo: data.paginationMetaInfo };
  }

  const all: Project[] = Array.isArray(data)
    ? data
    : (data?.projects ?? data?.list ?? data?.data ?? []);

  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    projects: paged,
    paginationMetaInfo: { totalCount, totalPages, currentPage: page, limit },
  };
}

// ✅ NEW: Get Projects by Client ID (NO refactor, pure addition)
export async function getProjectsByClientId(
  orgId: string,
  clientId: string,
  page: number = 1,
  limit: number = 100
): Promise<ProjectsResponse> {
  const { data } = await api.get(
    `/organization/${orgId}/hr-management/projects`,
    {
      params: {
        page,
        limit,
        client_company_id: clientId,
      },
    }
  );

  if (data && data.paginationMetaInfo) {
    return {
      projects: data.projects ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  const all: Project[] = Array.isArray(data)
    ? data
    : (data?.projects ?? data?.list ?? data?.data ?? []);

  return {
    projects: all,
    paginationMetaInfo: {
      totalCount: all.length,
      totalPages: 1,
      currentPage: page,
      limit,
    },
  };
}

export const projectsApi = {
  list: listProjects,
  getProjectsByClientId,
  get: async (orgId: string, projectId: string) => {
    const { data } = await api.get(`${base(orgId)}/${projectId}`);
    return data as Project;
  },

  create: async (orgId: string, input: Partial<Project>) => {
    const { data } = await api.post(base(orgId), input);
    return data as Project;
  },

  update: async (orgId: string, projectId: string, input: Partial<Project>) => {
    const { data } = await api.patch(`${base(orgId)}/${projectId}`, input);
    return data as Project;
  },

  remove: async (orgId: string, projectIdOrUrl: string) => {
    const { data } = await api.delete(`${base(orgId)}/${projectIdOrUrl}`);
    if (data?.message && String(data.message).includes('violates foreign key constraint')) {
      throw new Error(data.message);
    }
    return data as { message: string };
  },

  getAssignmentsByProject: async (orgId: string, projectId: string) => {
    const { data } = await api.get(
      `/organization/${orgId}/hr-management/projects/${projectId}/assignments`
    );
    return data;
  },

    // ✅ HR: Get assignments by project and employee
  // ✅ HR: Get assignments by project and employee
  getAssignmentsByProjectForEmployee: async (
    orgId: string,
    projectId: string,
    employeeId: string
  ) => {
    const { data } = await api.get(
      `/organization/${orgId}/hr-management/projects/${projectId}/assignments`,
      {
        params: { employee_id: employeeId }, // ✅ added
      }
    );
    return data;
  },

  getAllAssignmentsByProject: async (orgId: string, projectId: string) => {
    const { data } = await api.get(
      `/organization/${orgId}/hr-management/projects/${projectId}/all-assignments`
    );
    return data;
  },
  
  bulkAssignEmployees: async (
    orgId: string,
    projectId: string,
    assignments: Array<{
      employee_id: string;
      hourly_rate?: number;
      currency?: string;
      role?: string;
      start_date?: string;
      end_date?: string;
      is_active?: boolean;
      notes?: string;
    }>
  ) => {
    const { data } = await api.post(
      `/organization/${orgId}/hr-management/projects/${projectId}/assignments/bulk`,
      { assignments }
    );
    return data;
  },

  removeAssignment: async (orgId: string, assignmentId: string) => {
    const { data } = await api.delete(
      `/organization/${orgId}/hr-management/assignments/${assignmentId}`
    );
    return data as { message: string };
  },
};
