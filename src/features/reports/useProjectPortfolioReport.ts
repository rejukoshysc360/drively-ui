import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { api } from "../../lib/axios";
import { useAuth } from "../auth/AuthProvider";

export type ProjectPortfolioRow = {
  project_id: string;
  project_name: string;
  project_code?: string | null;
  client_name?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  estimated_hours: number;
  actual_hours: number;
  remaining_hours: number;
  spent_percent: number;
  employees_count: number;
};

export function useProjectPortfolioReport(
  from?: string,
  to?: string,
  status: string = "all"
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["project-portfolio-report", organization_id, from, to, status],
    queryFn: async () => {
      if (!organization_id || !from || !to) return [];

      const { data } = await api.get(
        `/organization/${organization_id}/reports/projects`,
        {
          params: {
            from: dayjs(from).format("YYYY-MM-DD"),
            to: dayjs(to).format("YYYY-MM-DD"),
            status,
          },
        }
      );

      return (data?.data ?? []) as ProjectPortfolioRow[];
    },
    enabled: !!organization_id && !!from && !!to,
  });
}
