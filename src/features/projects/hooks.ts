import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from './api';
import { useAuth } from '../auth/AuthProvider';
import { parseApiError } from '../../utils/parseApiError';
import { emitApiError } from '../../lib/error-bus';

type AuditEntry = {
  field_name: string;
  old_value: string;
  new_value: string;
  note: string;
};



const keys = {
  list: (orgId: string, page: number, limit: number, search?: string, from?: string, to?: string) =>
    ['projects', orgId, page, limit, search ?? '', from ?? '', to ?? ''] as const,
  one: (orgId: string, id: string) => ['projects', orgId, id] as const,
  assignments: (orgId: string, projectId: string) =>
    ['project-assignments', orgId, projectId] as const,
};

export function useProjects(
  page: number,
  limit: number,
  search?: string,
  from?: string,
  to?: string,
  sort_by?: string,
  sort_order?: 'asc' | 'desc'
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: organization_id
      ? ['projects', organization_id, page, limit, search ?? '', from ?? '', to ?? '', sort_by ?? '', sort_order ?? '']
      : ['projects', 'no-org'],

    queryFn: () =>
      projectsApi.list(
        organization_id!,
        page,
        limit,
        search,
        from,
        to,
        sort_by,
        sort_order
      ),

    enabled: !!organization_id,
  });
}

export function useProject(projectId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.one(organization_id, projectId) : ['projects', 'no-org', projectId],
    queryFn: () => projectsApi.get(organization_id!, projectId),
    enabled: !!organization_id && !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: any) => projectsApi.create(organization_id!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateProject(projectId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: any) => projectsApi.update(organization_id!, projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', organization_id] });
      qc.invalidateQueries({ queryKey: ['projects', organization_id, projectId] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      force,
      table,
    }: { projectId: string; force?: boolean; table?: string }) => {
      const url = force
        ? `${projectId}?force=true${table ? `&table=${table}` : ''}`
        : projectId;

      const res = await projectsApi.remove(organization_id!, url);
      if (res?.message?.includes('violates foreign key constraint')) {
        throw new Error(res.message);
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', organization_id] });
    },
  });
}

export function useBulkAssignEmployees(projectId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (assignments: any[]) =>
      projectsApi.bulkAssignEmployees(organization_id!, projectId, assignments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', organization_id] });
      qc.invalidateQueries({ queryKey: keys.assignments(organization_id!, projectId) });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useAssignments(projectId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: keys.assignments(organization_id!, projectId),
    queryFn: () => projectsApi.getAssignmentsByProject(organization_id!, projectId),
    enabled: !!organization_id && !!projectId,
  });
}

// ✅ HR-specific version: fetch project assignments for a given employee
export function useHRProjectAssignments(projectId: string, employeeId?: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ['hr-project-assignments', organization_id, projectId, employeeId ?? 'none'],
    queryFn: () =>
      projectsApi.getAssignmentsByProjectForEmployee(
        organization_id!,
        projectId,
        employeeId!
      ),
    enabled: !!organization_id && !!projectId && !!employeeId
  });
}


export function useAllAssignments(projectId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: keys.assignments(organization_id!, projectId),
    queryFn: () => projectsApi.getAllAssignmentsByProject(organization_id!, projectId),
    enabled: !!organization_id && !!projectId,
  });
} 


export function useDeleteAssignment() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (assignmentId: string) => projectsApi.removeAssignment(organization_id!, assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-assignments'] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

// =========================
// ✅ NEW: PROJECTS BY CLIENT (FOR INVOICE)
// =========================
export function useProjectsByClientId(
  clientId?: string,
  page: number = 1,
  limit: number = 100
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: [
      'projects-by-client',
      organization_id,
      clientId,
      page,
      limit,
    ],

    queryFn: () =>
      projectsApi.getProjectsByClientId(
        organization_id!,
        clientId!,
        page,
        limit
      ),

    enabled: !!organization_id && !!clientId, // ✅ only fires when client selected

    keepPreviousData: true, // ✅ smoother UX
  });
}