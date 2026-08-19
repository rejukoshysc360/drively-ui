import { api } from "../../lib/axios";

export type UpcomingBirthday = {
  id: string;
  full_name: string;
  email: string;
  dob: string;
  department_name?: string | null;
  designation_name?: string | null;
};

export type UpcomingBirthdaysResponse = {
  count: number;
  birthdays: UpcomingBirthday[];
};

// ✅ Base path for birthdays endpoint
const base = (orgId: string) =>
  `/organization/${orgId}/hr-management/employees/birthdays/upcoming`;

export const birthdaysApi = {
  /* -----------------------------
     GET UPCOMING BIRTHDAYS (next 7 days)
  ----------------------------- */
  list: async (orgId: string) => {
    const { data } = await api.get(base(orgId));
    return data as UpcomingBirthdaysResponse;
  },
};
