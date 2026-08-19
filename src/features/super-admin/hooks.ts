import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminOrganizationsApi } from "./api";

export function useAllOrganizations(
  page: number,
  limit: number,
  search?: string,
) {
  return useQuery({
    queryKey: ["super-admin-company-groups", page, limit, search ?? ""],
    queryFn: () => superAdminOrganizationsApi.list(page, limit, search),
    placeholderData: (previousData) => previousData,
  });
}

export function useUpdateFreeOrganizationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      status,
    }: {
      organizationId: string;
      status: "active" | "paused";
    }) =>
      superAdminOrganizationsApi.updateFreeOrganizationStatus(
        organizationId,
        status,
      ),

    onSuccess: (response, variables) => {
      queryClient.setQueriesData(
        {
          queryKey: ["super-admin-company-groups"],
        },
        (old: any) => {
          if (!old?.companyGroups) {
            return old;
          }

          return {
            ...old,
            companyGroups: old.companyGroups.map((group: any) => ({
              ...group,
              organizations: group.organizations.map((org: any) =>
                org.id === variables.organizationId
                  ? {
                      ...org,
                      subscription_status: response.status,
                    }
                  : org,
              ),
            })),
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: ["super-admin-company-groups"],
      });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) =>
      superAdminOrganizationsApi.deleteOrganization(organizationId),

    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ["super-admin-company-groups"],
      });

      queryClient.invalidateQueries({
        queryKey: ["super-admin-company-groups"],
      });
    },
  });
}
