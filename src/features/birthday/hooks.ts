import { useQuery } from "@tanstack/react-query";
import { birthdaysApi } from "./api";
import { useAuth } from "../auth/AuthProvider";
import { emitApiError } from "../../lib/error-bus";
import { parseApiError } from "../../utils/parseApiError";

/* -----------------------------
   REACT QUERY KEYS
----------------------------- */
const keys = {
  list: (orgId: string) => ["upcoming-birthdays", orgId] as const,
};

/* -----------------------------
   FETCH UPCOMING BIRTHDAYS
----------------------------- */
export function useUpcomingBirthdays() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: keys.list(organization_id!),
    queryFn: () => birthdaysApi.list(organization_id!),
    enabled: !!organization_id,
    staleTime: 1000 * 60 * 60 * 6, // 6 hours cache
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
