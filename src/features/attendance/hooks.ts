import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, AttendanceResponse } from "./api";
import { useAuth } from "../auth/AuthProvider";
import { parseApiError } from "../../utils/parseApiError";
import { emitApiError } from "../../lib/error-bus";

const keys = {
  list: (
    orgId: string,
    page: number,
    limit: number,
    search?: string,
    from?: string,
    to?: string,
    employeeId?: string,
    status?: string
  ) =>
    [
      "attendance",
      orgId,
      page,
      limit,
      search ?? "",
      from ?? "",
      to ?? "",
      employeeId ?? "",
      status ?? "",
    ] as const,

  one: (orgId: string, id: string) => ["attendance", orgId, id] as const,
  today: (orgId: string, date: string) =>
    ["attendance", orgId, "today", date] as const,
};

/* ------------------------------- Attendance List ------------------------------- */
export function useAttendance(
  page: number,
  limit: number,
  search?: string,
  from?: string,
  to?: string,
  employeeId?: string,
  status?: string,
  crossOrg?: boolean,
  sort_by?: string,                 // ✅ NEW (added only)
  sort_order?: "asc" | "desc"       // ✅ NEW (added only)
) {
  const { organization_id, profile } = useAuth();
  const qc = useQueryClient();

  // detect manager role
  const roleSlugs = Array.isArray(profile?.roles)
    ? profile.roles.map((r: any) => r.slug?.toLowerCase?.())
    : [profile?.roles?.slug?.toLowerCase?.()];
  const isManager = roleSlugs.includes("manager");
  const isHR = roleSlugs.includes("hr") || roleSlugs.includes("admin");

 
  const selfView = isManager || isHR ? "false" : "true";

  const hasFilters = !!from || !!to || !!status || !!employeeId;

  useEffect(() => {
    if (!organization_id) return;
    if (selfView === "true") return;
    if (!hasFilters) return;
    qc.removeQueries({
      queryKey: ["attendance", organization_id],
      exact: false,
    });
  }, [organization_id, from, to, employeeId, status, selfView, hasFilters, qc]);

  return useQuery({
    queryKey: organization_id
      ? [
          "attendance",
          organization_id,
          page,
          limit,
          search ?? "",
          from ?? "",
          to ?? "",
          employeeId ?? "",
          status ?? "",
          sort_by ?? "created_at",     // ✅ NEW (added only)
          sort_order ?? "desc",        // ✅ NEW (added only)
        ]
      : ["attendance", "no-org"],

    queryFn: () =>
      attendanceApi.list(
        organization_id!,
        page,
        limit,
        search,
        from,
        to,
        employeeId,
        status,
        crossOrg ?? isManager,
        selfView,
        sort_by,                     // ✅ NEW (added only)
        sort_order                  // ✅ NEW (added only)
      ),

    enabled: !!organization_id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
}

/* ------------------------------ Single Attendance ------------------------------ */
export function useAttendanceRecord(recordId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.one(organization_id, recordId)
      : ["attendance", "no-org", recordId],
    queryFn: () => attendanceApi.get(organization_id!, recordId),
    enabled: !!organization_id && !!recordId,
  });
}

/* ------------------------------ Update Attendance ------------------------------ */
export function useUpdateAttendance() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: ({
      recordId,
      input,
    }: {
      recordId: string;
      input: any;
    }) =>
      attendanceApi.update(organization_id!, recordId, input),

    onSuccess: async () => {
      await qc.refetchQueries({
        queryKey: ["attendance", organization_id],
        type: "active",
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}
/* ------------------------------ Delete Attendance ------------------------------ */
export function useDeleteAttendance() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (recordId: string) =>
      attendanceApi.remove(organization_id!, recordId),
    onSuccess: async () => {
      await qc.refetchQueries({
        queryKey: ["attendance", organization_id],
        type: "active",
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/* --------------------------- Today's Personal Attendance --------------------------- */
export function useTodayAttendance() {
  const { organization_id, user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const employeeId = user?.id;

  return useQuery<AttendanceResponse>({
    queryKey:
      organization_id && employeeId
        ? ["attendance", organization_id, "today", today, employeeId]
        : ["attendance", "no-org", "today"],
    queryFn: async () => {
      try {
        return await attendanceApi.list(
          organization_id!,
          1,
          5,
          undefined,
          today,
          today,
          employeeId,
          undefined,
          false,
          "true"
        );
      } catch {
        return {
          attendance: [],
          paginationMetaInfo: {
            totalCount: 0,
            totalPages: 1,
            currentPage: 1,
            limit: 5,
          },
        };
      }
    },
    enabled: !!organization_id && !!employeeId,
    staleTime: 0,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/* ----------------------------------- Clock In ----------------------------------- */
export function useClockIn() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (input: any) => attendanceApi.clockIn(organization_id!, input),

    onSuccess: async () => {
      const today = new Date().toISOString().slice(0, 10);

      // ✅ Refresh today's widget
      await qc.refetchQueries({
        queryKey: keys.today(organization_id!, today),
        type: "active",
      });

      // 🔥 FIX: Refresh attendance list (history)
      await qc.refetchQueries({
        queryKey: ["attendance", organization_id],
        type: "active",
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/* ---------------------------------- Clock Out ---------------------------------- */
export function useClockOut() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  return useMutation({
    mutationFn: ({
      attendanceId,
      geo_location_clock_out,
    }: {
      attendanceId: string;
      geo_location_clock_out?: string;
    }) =>
      attendanceApi.clockOut(
        organization_id!,
        attendanceId,
        undefined,
        geo_location_clock_out
      ),

    onSuccess: async () => {
      // ✅ Refresh today
      await qc.refetchQueries({
        queryKey: keys.today(organization_id!, today),
        type: "active",
      });

      // 🔥 FIX: Refresh history list
      await qc.refetchQueries({
        queryKey: ["attendance", organization_id],
        type: "active",
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}
/* ---------------------------- Employees with No Punch ---------------------------- */
export function useNoPunchToday() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["no-punch-today", organization_id],
    queryFn: () => attendanceApi.noPunchToday(organization_id!),
    enabled: !!organization_id,
    staleTime: 0,
  });
}

export function useUpdateAttendanceByManager() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: ({
      attendanceId,
      payload,
    }: {
      attendanceId: string;
      payload: {
        clock_in?: string;
        clock_out?: string;
      };
    }) =>
      attendanceApi.updateByManager(
        organization_id!,
        attendanceId,
        payload
      ),

    onSuccess: async (_, variables) => {
      // ✅ Refresh attendance list
      await qc.refetchQueries({
        queryKey: ["attendance", organization_id],
        type: "active",
      });

      // ✅ Refresh single record (optional but good)
      await qc.refetchQueries({
        queryKey: ["attendance", organization_id, variables.attendanceId],
        type: "active",
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/* --------------------------- Export Attendance (Excel) --------------------------- */
export function useExportAttendance() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      from,
      to,
      employeeId,
      status,
    }: {
      from: string;
      to: string;
      employeeId?: string;
      status?: string;
    }) => {
      return await attendanceApi.export(
        organization_id!,
        from,
        to,
        employeeId,
        status
      ); // ✅ return blob directly
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}