export type AssignableEmployee = {
  id: string;
  full_name: string;
  email: string;

  role_name?: string | null;
  role_slug?: string | null;
};

export type OrganizationItem = {
  id: string;
  name: string;
};

export type UserOrganizationResponse = {
  employee_id: string;
  organizations: OrganizationItem[];
};