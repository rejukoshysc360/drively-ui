import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { api } from "../../lib/axios";
import { useAuth } from "../auth/AuthProvider";

export type AllocationRow = {
  employee_id: string;
  employee_name: string;
  contracted_hours: number;
  actual_hours: number;
  utilization_percent: number; // 0..150+
  status: "BENCH" | "UTILIZED" | "OVERLOADED" | "UNDERUTILIZED";
  projects: Array<{
    project_id: string | "unassigned";
    project_name: string;
    hours_logged: number;
  }>;
  // --- Enhanced fields (Option C)
  daily_hours: number;
  working_days_count: number;
  days_remaining: number;
  burn_rate_per_day: number;        // h/day
  required_hours_per_day: number;   // h/day to hit capacity by 'to'
  risk_category: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  trend: Array<{ date: string; hours: number; util_percent: number }>;
  unassigned_hours: number;
};

export function useEmployeeAllocationReport(from?: string, to?: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["employee-allocation-report", organization_id, from, to],
    queryFn: async () => {
      if (!organization_id || !from || !to) return [];
      const { data } = await api.get(
        `/organization/${organization_id}/reports/employee-allocation`,
        { params: { from: dayjs(from).format("YYYY-MM-DD"), to: dayjs(to).format("YYYY-MM-DD") } }
      );
      return (data?.data ?? []) as AllocationRow[];
    },
    enabled: !!organization_id && !!from && !!to,
  });
}
