import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "../auth/AuthProvider";

import {
  assignUserOrganizations,
  getUserOrganizations,
  listAssignableEmployees,
} from "./api";
 
import { emitSuccess } from "../../lib/success-bus";

export function useAssignableEmployees(
  page: number,
  limit: number,
  search?: string,
  roles?: string[]
) {
  const { organization_id } =
    useAuth();

  return useQuery({
    queryKey: [
      "assignable-employees",
      organization_id,
      page,
      limit,
      search ?? "",
      roles?.join(",") ?? "",
    ],

    queryFn: () =>
      listAssignableEmployees(
        organization_id!,
        page,
        limit,
        search,
        roles
      ),

    enabled: !!organization_id,
  });
}

export function useUserOrganizations(
  employeeId?: string
) {
  const { organization_id } =
    useAuth();

  return useQuery({
    queryKey: [
      "user-organizations",
      organization_id,
      employeeId,
    ],

    queryFn: () =>
      getUserOrganizations(
        organization_id!,
        employeeId!
      ),

    enabled:
      !!organization_id &&
      !!employeeId,
  });
}

export function useAssignUserOrganizations() {
  const { organization_id } =
    useAuth();

  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      organizationIds,
    }: {
      employeeId: string;
      organizationIds: string[];
    }) =>
      assignUserOrganizations(
        organization_id!,
        employeeId,
        organizationIds
      ),

    onSuccess: (_, vars) => {
      qc.invalidateQueries({
        queryKey: [
          "user-organizations",
          organization_id,
          vars.employeeId,
        ],
      });

      // ✅ SUCCESS MESSAGE
      emitSuccess({
        message:
          "Organization assignments updated successfully",
      });
    },
  });
}