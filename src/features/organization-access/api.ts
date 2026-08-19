import { api } from "../../lib/axios";

export type UserOrganizationAssignment =
  {
    employee_id: string;

    organizations: {
      id: string;
      name: string;
    }[];
  };

export async function listAssignableEmployees(
  orgId: string,
  page: number,
  limit: number,
  search?: string,
  roles?: string[]
) {
  const params: Record<
    string,
    any
  > = {
    page,
    limit,
  };

  if (search?.trim()) {
    params.search =
      search.trim();
  }

  // ✅ pass multiple roles
  if (
    roles &&
    roles.length > 0
  ) {
    params.roles =
      roles.join(",");
  }

  const { data } =
    await api.get(
      `/organization/${orgId}/hr-management/employees-by-roles`,
      { params }
    );

  return {
    employees:
      data?.employees ?? [],

    paginationMetaInfo:
      data?.paginationMetaInfo ??
      {
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        limit,
      },
  };
}

export async function getUserOrganizations(
  orgId: string,
  employeeId: string
): Promise<UserOrganizationAssignment> {
  const { data } =
    await api.get(
      `/organization/${orgId}/user-organizations/${employeeId}`
    );

  return data;
}

export async function assignUserOrganizations(
  orgId: string,
  employeeId: string,
  organization_ids: string[]
) {
  const { data } =
    await api.post(
      `/organization/${orgId}/user-organizations/assign`,
      {
        user_id: employeeId,
        organization_ids,
      }
    );

  return data;
}