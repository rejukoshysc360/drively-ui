// src/features/employee-groups/hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  employeeGroupsApi,
  CreateEmployeeGroupInput,
  UpdateEmployeeGroupInput,
} from "./api";

import { useAuth } from "../../auth/AuthProvider";
import { parseApiError } from "../../../utils/parseApiError";
import { emitApiError } from "../../../lib/error-bus";

const keys = {
  list: (orgId: string, page: number, limit: number, search?: string) =>
    ["employee-groups", orgId, page, limit, search ?? ""] as const,

  one: (orgId: string, id: string) =>
    ["employee-groups", orgId, id] as const,
};

/** ✅ Get all groups */
export function useEmployeeGroups(
  page: number,
  limit: number,
  search?: string
) {
  const { organization_id, user } = useAuth();

  return useQuery({
    queryKey: organization_id && user?.id
  ? ["employee-groups", organization_id, user.id, page, limit, search ?? ""]
  : ["employee-groups", "no-org"],

    queryFn: () =>
      employeeGroupsApi.list(
        organization_id!,
        page,
        limit,
        search
      ),

    enabled: !!organization_id,
    keepPreviousData: true,
  });
}

/** ✅ Get one group */
export function useEmployeeGroup(groupId: string) {
  const { organization_id, user } = useAuth();

  return useQuery({
   queryKey: organization_id && user?.id
  ? ["employee-groups", organization_id, user.id, groupId]
  : ["employee-groups", "no-org", groupId],

    queryFn: () =>
      employeeGroupsApi.get(organization_id!, groupId),

    enabled: !!organization_id && !!groupId,
  });
}

/** ✅ Create group */
export function useCreateEmployeeGroup() {
  const qc = useQueryClient();
 const { organization_id, user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateEmployeeGroupInput) =>
      employeeGroupsApi.create(organization_id!, input),

    onSuccess: () => {
     qc.invalidateQueries({
  queryKey: ["employee-groups", organization_id, user?.id],
});
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Update group */
export function useUpdateEmployeeGroup() {
  const qc = useQueryClient();
 const { organization_id, user } = useAuth();

  return useMutation({
    mutationFn: (args: { id: string } & UpdateEmployeeGroupInput) =>
      employeeGroupsApi.update(
        organization_id!,
        args.id,
        args
      ),

    onSuccess: (_data, variables) => {
     qc.invalidateQueries({
  queryKey: ["employee-groups", organization_id, user?.id],
});
     qc.invalidateQueries({
  queryKey: ["employee-groups", organization_id, user?.id, variables.id],
});
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Delete group */
export function useDeleteEmployeeGroup() {
  const qc = useQueryClient();
  const { organization_id, user } = useAuth();

  return useMutation({
    mutationFn: (groupId: string) =>
      employeeGroupsApi.remove(organization_id!, groupId),

    onSuccess: () => {
     qc.invalidateQueries({
  queryKey: ["employee-groups", organization_id, user?.id],
});
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}