import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  employeePersonalApi,
  CreateEmployeePersonalInput,
  UpdateEmployeePersonalInput,
} from "./api";
import { useAuth } from "../../auth/AuthProvider";
import { parseApiError } from "../../../utils/parseApiError";
import { emitApiError } from "../../../lib/error-bus";

const keys = {
  one: (orgId: string, employeeId: string) =>
    ["employeePersonal", orgId, employeeId] as const,
};

export function useEmployeePersonal(employeeId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.one(organization_id, employeeId)
      : ["employeePersonal", "no-org", employeeId],
    queryFn: () => employeePersonalApi.get(organization_id!, employeeId),
    enabled: !!organization_id && !!employeeId,
  });
}

export function useCreateEmployeePersonal(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateEmployeePersonalInput) =>
      employeePersonalApi.create(organization_id!, employeeId, input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: keys.one(organization_id!, employeeId),
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateEmployeePersonal(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateEmployeePersonalInput) =>
      employeePersonalApi.update(organization_id!, employeeId, input),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: keys.one(organization_id!, employeeId),
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteEmployeePersonal(employeeId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: () =>
      employeePersonalApi.remove(organization_id!, employeeId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: keys.one(organization_id!, employeeId),
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
