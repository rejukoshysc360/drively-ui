import { api } from '../../lib/axios';

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'WFH'
  | 'ON_LEAVE'
  | 'COMPLETED'
  | string;

export type Attendance = {
  id: string;
  organization_id: string;
  employee_id: string;
  employee_name?: string;
  employee_email?: string;
  clock_in?: string | null;
  clock_out?: string | null;
  total_hours?: number | null; 
  status?: string | null;
  created_at?: string;
  geo_location_name?: string | null;   // optional
  is_late?: boolean | null;            // ✅ new
  late_by_minutes?: number | null;     // ✅ new
  employees?: {
    id: string;
    email?: string | null;
    full_name?: string | null;
  } | null;
};


export type AttendanceResponse = {
  attendance: Attendance[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) => `/organization/${orgId}/hr-management/attendance`;

/** ✅ Now accepts and forwards `status` */
export async function listAttendance(
  orgId: string,
  page: number,
  limit: number,
  search?: string,
  from?: string,
  to?: string,
  employeeId?: string,
  status?: string,
  crossOrg?: boolean,
  selfView?: string | boolean,
  sort_by?: string,                 // ✅ NEW (added only)
  sort_order?: "asc" | "desc"       // ✅ NEW (added only)
){
  // ✅ UPDATED (added sort params, nothing removed)
  const params: Record<string, any> = {
    page,
    limit,
    sort_by,
    sort_order,
  };

  if (search?.trim()) params.search = search.trim();
  if (from) params.from = from;
  if (to) params.to = to;
  if (employeeId) params.employeeId = employeeId;
  if (status) params.status = status;
  if (crossOrg) params["cross-org"] = 1;

  if (typeof selfView !== "undefined") {
    params.selfView = String(selfView);
  }

  const { data } = await api.get(base(orgId), { params });

  if (data && data.paginationMetaInfo) {
    const attendance =
      data.attendance ??
      data.attendances ??
      data.list ??
      data.data ??
      [];

    return { attendance, paginationMetaInfo: data.paginationMetaInfo };
  }

  // Fallback (unchanged)
  const all: Attendance[] = Array.isArray(data)
    ? data
    : data?.attendance ?? data?.attendances ?? [];

  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    attendance: paged,
    paginationMetaInfo: { totalCount, totalPages, currentPage: page, limit },
  };
}

export async function exportAttendance(
  orgId: string,
  from: string,
  to: string,
  employeeId?: string,
  status?: string
) {
  const params: Record<string, any> = {
    from,
    to,
  };

  if (employeeId) params.employeeId = employeeId;
  if (status) params.status = status;

  const response = await api.get(
    `${base(orgId)}/export`,
    {
      params,
      responseType: "blob", // 🔥 REQUIRED for file download
    }
  );

  return response.data; // blob
}

export async function updateAttendanceByManager(
  orgId: string,
  attendanceId: string,
  input: {
    clock_in?: string;
    clock_out?: string;
  }
) {
  const { data } = await api.patch(
    `${base(orgId)}/update/${attendanceId}`,
    input
  );

  return data as Attendance;
}

export const attendanceApi = {
  list: listAttendance,
  updateByManager: updateAttendanceByManager,
  export: exportAttendance,
  get: async (orgId: string, recordId: string) => {
    const { data } = await api.get(`${base(orgId)}/${recordId}`);
    return data as Attendance;
  },
  clockIn: async (orgId: string, input: Partial<Attendance>) => {
    const { data } = await api.post(`${base(orgId)}/clock-in`, input);
    return data as Attendance;
  },
clockOut: async (
  orgId: string,
  attendanceId: string,
  geo_location?: any,                    // coordinates (if you ever use them)
  geo_location_clock_out?: string        // the address string
) => {
  const payload: any = {};
  
  if (geo_location) {
    payload.geo_location = geo_location;
  }
  
  if (geo_location_clock_out) {
    payload.geo_location_clock_out = geo_location_clock_out;
  }

  const { data } = await api.patch(
    `${base(orgId)}/clock-out/${attendanceId}`,
    payload
  );
  return data as Attendance;
},
  update: async (orgId: string, recordId: string, input: Partial<Attendance>) => {
    const { data } = await api.patch(`${base(orgId)}/${recordId}`, input);
    return data as Attendance;
  },
  remove: async (orgId: string, recordId: string) => {
    const { data } = await api.delete(`${base(orgId)}/${recordId}`);
    return data as { message: string };
  },
  noPunchToday: async (orgId: string) => {
    const { data } = await api.get(`${base(orgId)}/no-punch-today`);
    return data as { count: number; employees: string[] };
  },
  
};
