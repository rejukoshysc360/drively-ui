import { api } from "../../lib/axios";

/* ----------------------------------
   🔹 Type Definitions
---------------------------------- */
export type TimesheetEntry = {
  id: string;
  timesheet_id: string;
  project_id?: string | null;
  task_id?: string | null; // optional reference to tasks table
  task_name?: string | null;      // 🆕 add this
  task_path?: string | null;      // 🆕 add this
  hours: number;
  activity?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
};

export type Timesheet = {
  id: string;
  organization_id: string;
  employee_id: string;
  date: string;
  total_hours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  entries?: TimesheetEntry[];
  employee_name?: string | null;
  employee_email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/* ----------------------------------
   🔹 Base URL Helpers
---------------------------------- */
const base = (orgId: string) => `/organization/${orgId}/hr-management/timesheets`;
const entryBase = (orgId: string, timesheetId: string) =>
  `/organization/${orgId}/hr-management/timesheets/${timesheetId}/entries`;

/* ----------------------------------
   🔹 Timesheets API
---------------------------------- */
export const timesheetsApi = {
  // 📄 Paginated list (HR/Admin)
  list: async (orgId: string, page = 1, limit = 20, search?: string, from?: string, to?: string) => {
    const { data } = await api.get(base(orgId), { params: { page, limit, search, from, to } });
    return Array.isArray(data) ? data : data.timesheets ?? [];
  },

  // 📄 Get by ID
  get: async (orgId: string, id: string) => {
    const { data } = await api.get(`${base(orgId)}/${id}`);
    return data as Timesheet;
  },

  // 🟢 Create
  create: async (orgId: string, input: Partial<Timesheet>) => {
    const { data } = await api.post(base(orgId), input);
    return data as Timesheet;
  },

  // 🟡 Update
  update: async (orgId: string, id: string, input: Partial<Timesheet>) => {
    const { data } = await api.put(`${base(orgId)}/${id}`, input);
    return data as Timesheet;
  },

  // 🔴 Delete
  remove: async (orgId: string, id: string) => {
    const { data } = await api.delete(`${base(orgId)}/${id}`);
    return data;
  }, 
  // 🧩 Bulk upsert (for HR/Admin)
  bulkUpsert: async (orgId: string, timesheets: any[]) => {
    const { data } = await api.post(`${base(orgId)}/bulk`, { timesheets });
    return data as Timesheet[];
  },
  updateWithEntries: async (orgId: string, id: string, input: Partial<Timesheet>) => {
  const { data } = await api.put(`${base(orgId)}/${id}/with-entries`, input);
  return data as Timesheet;
 },
 getMyProjects: async (orgId: string) => {
  const { data } = await api.get(`/organization/${orgId}/hr-management/assignments-mine/my-projects`);
  return Array.isArray(data) ? data : data.projects ?? [];
 }, 
  // 🔹 Get by employee + month (HR view)
  getByEmployeeAndMonth: async (orgId: string, employeeId: string, year: number, month: number) => {
    const { data } = await api.get(`${base(orgId)}/employee/${employeeId}`, {
      params: { year, month },
    });
    return Array.isArray(data) ? data : data.timesheets ?? [];
  },

  // 📤 Export timesheets (Excel download)
// Add this function under your timesheetsApi
exportByEmployeeAndMonth: async (orgId: string, employeeId: string, from: string, to: string) => {
  const { data } = await api.get(
    `${base(orgId)}/employee/${employeeId}/export`,
    { params: { from, to }, responseType: "blob" } // ensure it returns file
  );
  return data;
},



  // 🔹 Employee assignments
  getMyAssignments: async (orgId: string) => {
    const { data } = await api.get(`/organization/${orgId}/hr-management/my-assignments`);
    return Array.isArray(data) ? data : data.assignments ?? [];
  },

  getAssignmentsByEmployee: async (orgId: string, employeeId: string) => {
  const { data } = await api.get(
    `/organization/${orgId}/hr-management/assignments/employee/${employeeId}`
  );
  return Array.isArray(data) ? data : data.assignments ?? [];
},

  // 🔹 Employee self (week view)
  getAllForMyself: async (orgId: string, from: string, to: string) => {
    const { data } = await api.get(`${base(orgId)}/myself`, { params: { from, to } });
    // 🛡️ Always return an array to avoid `.find is not a function` crashes
    return Array.isArray(data) ? data : data.timesheets ?? [];
  },

  // 🔹 Bulk upsert (employee self - all projects/week)
bulkUpsertAll: async (orgId: string, timesheets: any[]) => {
  const { data } = await api.post(`${base(orgId)}/bulk-upsert-all`, { timesheets });

  // Return full structured backend payload (success/message/data)
  if (data && typeof data === "object" && "success" in data) {
    return data;
  }

  // Fallback for older backend responses (pure array)
  return { success: true, data: Array.isArray(data) ? data : [] };
},
  // 🔹 Weekly pending timesheet summary (dashboard KPI)
getPendingSummary: async (orgId: string) => {
  const { data } = await api.get(
    `/organization/${orgId}/hr-management/timesheets/pending-summary`
  );
  return data;
},
// Update to timesheetsApi in the api layer (assume path like hooks/api/timesheets.ts)
getTaskProgress: async (orgId: string, projectId: string, taskId: string) => {
  const { data } = await api.get(
    `/organization/${orgId}/hr-management/projects/${projectId}/tasks/${taskId}/progress`
  );
  return Array.isArray(data) ? data : data.progress || [];
},
// 🔍 Activity Suggestions
getActivitySuggestions: async (
  orgId: string,
  search: string,
  projectId?: string
) => {
  const { data } = await api.get(
    `/organization/${orgId}/hr-management/timesheets/activity-suggestions`,
    {
      params: {
        search,
        project_id: projectId || undefined,
      },
    }
  );

  // always return array
  return Array.isArray(data) ? data : data.suggestions ?? [];
},
};

/* ----------------------------------
   🔹 Timesheet Entries API
---------------------------------- */
export const timesheetEntriesApi = {
  list: async (orgId: string, timesheetId: string) => {
    const { data } = await api.get(entryBase(orgId, timesheetId));
    return Array.isArray(data) ? data : data.entries ?? [];
  },

  create: async (orgId: string, timesheetId: string, input: Partial<TimesheetEntry>) => {
    const { data } = await api.post(entryBase(orgId, timesheetId), input);
    return data as TimesheetEntry;
  },

  update: async (orgId: string, timesheetId: string, entryId: string, input: Partial<TimesheetEntry>) => {
    const { data } = await api.put(`${entryBase(orgId, timesheetId)}/${entryId}`, input);
    return data as TimesheetEntry;
  },

  remove: async (orgId: string, timesheetId: string, entryId: string) => {
    const { data } = await api.delete(`${entryBase(orgId, timesheetId)}/${entryId}`);
    return data;
  }, 
};
