import { api } from "../../lib/axios";

export type Task = {
  id: string;
  project_id: string;
  parent_id?: string | null;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  progress: number;
  position?: number | null;
  status: "Open" | "In Progress" | "Completed" | "Blocked" | "done";
  dependencies?: string[];
  assignee_ids?: string[];
  created_at?: string;
  updated_at?: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  employee_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  employee?: { full_name: string; email: string };
};

export type PaginatedResponse<T> = {
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
} & T;

const base = (orgId: string, projectId: string) =>
  `/organization/${orgId}/hr-management/projects/${projectId}/tasks`;

export const tasksApi = {
  /** ✅ Paginated project tasks — supports search, sort & filter */
  listPaginated: async (
    orgId: string,
    projectId: string,
    page = 1,
    limit = 10,
    search?: string,
    sortBy?: string,
    statusFilter?: string,
    includeAssignments = false 
  ): Promise<PaginatedResponse<{ tasks: Task[] }>> => {
    const params: Record<string, any> = { page, limit };
    if (search?.trim()) params.search = search.trim();

    // 🔹 map frontend values to backend params
    if (sortBy) {
      // e.g. start_date_asc → sort_by=start_date, sort_dir=asc
      const [field, dir] = sortBy.split("_");
      params.sort_by = field;
      params.sort_dir = dir === "desc" ? "desc" : "asc";
    }

    if (statusFilter && statusFilter !== "all") params.status = statusFilter;

    // ✅ Add includeAssignments flag
    if (includeAssignments) params.include_assignments = "true";

    const { data } = await api.get(base(orgId, projectId), { params });

    if (data?.paginationMetaInfo) {
      const tasks = data.tasks ?? data.data ?? [];
      return { tasks, paginationMetaInfo: data.paginationMetaInfo };
    }

    // fallback for plain array
    const all: Task[] = Array.isArray(data) ? data : data?.tasks ?? [];
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);
    const totalCount = all.length;

    return {
      tasks: paged,
      paginationMetaInfo: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        currentPage: page,
        limit,
      },
    };
  },

  /** ✅ Paginated My Assigned Tasks — supports search, sort & filter */
  myAssignmentsPaginated: async (
    orgId: string,
    page = 1,
    limit = 10,
    search?: string,
    sortBy?: string,
    statusFilter?: string,
    projectId?: string
  ): Promise<PaginatedResponse<{ assignments: any[] }>> => {
    const params: Record<string, any> = { page, limit };
    if (search?.trim()) params.search = search.trim();
    if (sortBy) {
      const lastUnderscore = sortBy.lastIndexOf("_");
      const field = sortBy.slice(0, lastUnderscore); // "start_date"
      const dir = sortBy.slice(lastUnderscore + 1);  // "asc" or "desc"

      params.sort_by = field.replace("_date", ""); // optional cleanup
      params.sort_dir = dir === "desc" ? "desc" : "asc";
    }
    if (statusFilter && statusFilter !== "all") params.status = statusFilter;

    if (projectId) params.project_id = projectId;

    const { data } = await api.get(
      `/organization/${orgId}/hr-management/my-assigned-tasks`,
      { params }
    );

    if (data?.paginationMetaInfo) {
      const assignments = data.assignments ?? data.tasks ?? data.data ?? [];
      return { assignments, paginationMetaInfo: data.paginationMetaInfo };
    }

    // fallback
    const all: any[] = Array.isArray(data)
      ? data
      : data?.assignments ?? data?.tasks ?? [];
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);
    const totalCount = all.length;

    return {
      assignments: paged,
      paginationMetaInfo: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
        currentPage: page,
        limit,
      },
    };
  },

  /** ✅ Non-paginated list */
  list: async (orgId: string, projectId: string, includeAssignments = false) => {
    const { data } = await api.get(base(orgId, projectId), {
      params: { include_assignments: includeAssignments },
    });
    return data as Task[];
  },

  get: async (orgId: string, projectId: string, taskId: string) => {
    const { data } = await api.get(`${base(orgId, projectId)}/${taskId}`);
    return data as Task;
  },

  create: async (orgId: string, projectId: string, input: Partial<Task>) => {
    const { data } = await api.post(base(orgId, projectId), input);
    return data as Task;
  },

  update: async (
    orgId: string,
    projectId: string,
    taskId: string,
    input: Partial<Task>
  ) => {
    const { data } = await api.put(`${base(orgId, projectId)}/${taskId}`, input);
    return data as Task;
  },

  remove: async (orgId: string, projectId: string, taskId: string) => {
    const { data } = await api.delete(`${base(orgId, projectId)}/${taskId}`);
    return data as { message: string };
  },

  reorder: async (
    orgId: string,
    projectId: string,
    items: Array<{ id: string; position: number; parent_id: string | null }>
  ) => {
    const { data } = await api.post(`${base(orgId, projectId)}/reorder`, { items });
    return data as { ok: boolean; count: number };
  },

  getAssignments: async (orgId: string, projectId: string, taskId: string) => {
    const { data } = await api.get(`${base(orgId, projectId)}/${taskId}/assignments`);
    return data;
  },

assignEmployees: async (
  orgId: string,
  projectId: string,
  taskId: string,
  assignments: Array<{ employee_id: string; hours: number }>
) => {
  const { data } = await api.post(
    `${base(orgId, projectId)}/${taskId}/assignments`,
    { assignments } // ✅ structured payload
  );
  return data;
},

  myAssignments: async (orgId: string) => {
    const { data } = await api.get(
      `/organization/${orgId}/hr-management/my-assigned-tasks`
    );
    return data;
  },

  updateAssignmentStatus: async (
  orgId: string,
  assignmentId: string,
  status: string
) => {
  const { data } = await api.patch(
    `/organization/${orgId}/hr-management/assignments/${assignmentId}/status`,
    { status }
  );
  return data;
},

  listComments: async (orgId: string, projectId: string, taskId: string) => {
    const { data } = await api.get(`${base(orgId, projectId)}/${taskId}/comments`);
    return data as TaskComment[];
  },

  addComment: async (
    orgId: string,
    projectId: string,
    taskId: string,
    input: { comment_text: string; parent_comment_id?: string | null }
  ) => {
    const { data } = await api.post(
      `${base(orgId, projectId)}/${taskId}/comments`,
      input
    );
    return data as TaskComment;
  },

  updateComment: async (
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    input: { comment_text: string }
  ) => {
    const { data } = await api.patch(
      `${base(orgId, projectId)}/${taskId}/comments/${commentId}`,
      input
    );
    return data as TaskComment;
  },

  deleteComment: async (
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string
  ) => {
    const { data } = await api.delete(
      `${base(orgId, projectId)}/${taskId}/comments/${commentId}`
    );
    return data as { message: string };
  },

  listCommentAttachments: async (
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string
  ) => {
    const { data } = await api.get(
      `${base(orgId, projectId)}/${taskId}/comments/${commentId}/attachments`
    );
    return data;
  },

  uploadCommentAttachment: async (
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    file: File,
    opts?: { onProgress?: (percent: number) => void }
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(
      `${base(orgId, projectId)}/${taskId}/comments/${commentId}/attachments`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!opts?.onProgress || !evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          opts.onProgress(pct);
        },
      }
    );
    return data;
  },

  deleteCommentAttachment: async (
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    attachmentId: string
  ) => {
    const { data } = await api.delete(
      `${base(orgId, projectId)}/${taskId}/comments/${commentId}/attachments/${attachmentId}`
    );
    return data;
  },

  downloadCommentAttachment: async (
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    attachmentId: string
  ) => {
    const { data } = await api.get(
      `${base(orgId, projectId)}/${taskId}/comments/${commentId}/attachments/${attachmentId}/download`
    );
    return data as { url: string };
  },
  getTitleSuggestions: async (
  orgId: string,
  projectId: string,
  search: string
) => {
  const { data } = await api.get(
    `/organization/${orgId}/hr-management/projects/${projectId}/tasks/title-suggestions`,
    { params: { search } }
  );
  return data as string[];
},
};
