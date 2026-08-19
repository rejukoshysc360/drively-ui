import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  projectEmployeeApi,
  AssignEmployeesInput,
} from "./api";
import { useAuth } from "../auth/AuthProvider";
import { parseApiError } from "../../utils/parseApiError";
import { emitApiError } from "../../lib/error-bus";

const keys = {
  list: (orgId: string, projectId: string) =>
    ["project-employees", orgId, projectId] as const,
};

// =========================
// 📥 GET ASSIGNED EMPLOYEES (PROJECT)
// =========================
export function useProjectEmployees(projectId?: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey:
      organization_id && projectId
        ? keys.list(organization_id, projectId)
        : ["project-employees", "no-org"],

    queryFn: () =>
      projectEmployeeApi.list(organization_id!, projectId!),

    enabled: !!organization_id && !!projectId,
  });
}

// =========================
// 🔗 ASSIGN EMPLOYEES (PROJECT WITH RATE)
// =========================
export function useAssignProjectEmployees(projectId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    // 🔥 IMPORTANT CHANGE HERE
    mutationFn: (input: AssignEmployeesInput) =>
      projectEmployeeApi.assign(
        organization_id!,
        projectId,
        input
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["project-employees", organization_id, projectId],
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

// =========================
// ❌ REMOVE EMPLOYEE (PROJECT)
// =========================
export function useRemoveProjectEmployee(projectId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (employeeId: string) =>
      projectEmployeeApi.remove(
        organization_id!,
        projectId,
        employeeId
      ),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["project-employees", organization_id, projectId],
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}