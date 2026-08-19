import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { api } from "../../lib/axios";
import { useAuth } from "../auth/AuthProvider";

export type ProjectBurnRow = {
  project_id: string;
  project_name: string;
  project_code?: string | null;        
  project_reference?: string | null;  
  estimated_hours: number;
  actual_hours: number;
  remaining_hours: number;
  percent_spent: number;
  status: "ON_TRACK" | "AT_RISK" | "OVER_BUDGET" | "NO_BUDGET" | "BEHIND_SCHEDULE";
  burn_up: Array<{ bucket: string; value: number }>;
  burn_down: Array<{ bucket: string; value: number }>;
  employees: Array<{ employee_id: string; employee_name: string; hours: number }>;
  timeline_percent: number;
  required_actual_hours: number;
  delta_hours: number;
  work_percent: number;
};

export function useProjectBurnReport(
  from?: string,
  to?: string,
  granularity: "day" | "week" | "month" = "week"
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["project-burn-report", organization_id, from, to, granularity],
    queryFn: async () => {
      if (!organization_id || !from || !to) return [];
      const { data } = await api.get(
        `/organization/${organization_id}/reports/project-burn`,
        {
          params: {
            from: dayjs(from).format("YYYY-MM-DD"),
            to: dayjs(to).format("YYYY-MM-DD"),
            granularity,
          },
        }
      );
      return (data?.data ?? []) as ProjectBurnRow[];
    },
    enabled: !!organization_id && !!from && !!to,
  });
}
