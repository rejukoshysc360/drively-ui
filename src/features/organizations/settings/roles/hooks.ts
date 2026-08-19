import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesApi, CreateRoleInput, UpdateRoleInput } from "./api";
import { useAuth } from "../../../auth/AuthProvider";
import { parseApiError } from "../../../../utils/parseApiError";
import { emitApiError } from "../../../../lib/error-bus";

const keys = {
  list: (orgId: string, page: number, limit: number, search?: string) =>
    ["roles", orgId, page, limit, search ?? ""] as const,
  one: (orgId: string, id: string) => ["roles", orgId, id] as const,
};

export function useRoles(page: number, limit: number, search?: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.list(organization_id, page, limit, search) : ["roles", "no-org"],
    queryFn: () => rolesApi.list(organization_id!, page, limit, search),
    enabled: !!organization_id,
  });
}

export function useRole(roleId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.one(organization_id, roleId) : ["role", "no-org", roleId],
    queryFn: () => rolesApi.get(organization_id!, roleId),
    enabled: !!organization_id && !!roleId,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateRoleInput) => rolesApi.create(organization_id!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateRole(roleId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateRoleInput) => rolesApi.update(organization_id!, roleId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles", organization_id] });
      qc.invalidateQueries({ queryKey: ["roles", organization_id, roleId] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (roleId: string) => rolesApi.remove(organization_id!, roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles", organization_id] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
