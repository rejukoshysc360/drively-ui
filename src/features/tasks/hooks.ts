import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi, Task } from "./api";
import { useAuth } from "../auth/AuthProvider";
import { parseApiError } from "../../utils/parseApiError";
import { emitApiError } from "../../lib/error-bus";

const keys = {
  list: (
    orgId: string,
    projectId: string | null,
    page?: number,
    limit?: number,
    search?: string,
    sortBy?: string,
    statusFilter?: string,
    includeAssignments?: boolean
  ) =>
    [
      "tasks",
      orgId,
      projectId ?? "all",
      page ?? 1,
      limit ?? 20,
      search ?? "",
      sortBy ?? "",
      statusFilter ?? "",
      includeAssignments ?? false,
    ] as const,
  one: (orgId: string, projectId: string, taskId: string) =>
    ["tasks", orgId, projectId, taskId] as const,
  assignments: (orgId: string, projectId: string, taskId: string) =>
    ["task-assignments", orgId, projectId, taskId] as const,
  comments: (orgId: string, projectId: string, taskId: string) =>
    ["task-comments", orgId, projectId, taskId] as const,
};

/** ✅ Enhanced useTasks — now supports pagination, search, sort & status filter (server-side) */
export function useTasks(
  projectId: string,
  enabled: boolean,
  page: number,
  limit: number,
  search?: string,
  sortBy?: string,
  status?: string,
  includeAssignments = false 
) {
  const { organization_id } = useAuth(); // ✅ pull from context

  return useQuery({
    queryKey: ["tasks", organization_id, projectId, page, limit, search, sortBy, status,includeAssignments],
    queryFn: () =>
      tasksApi.listPaginated(
        organization_id!,
        projectId,
        page,
        limit,
        search,
        sortBy,
        status,
        includeAssignments
      ),
    enabled: !!organization_id && enabled, // ✅ gate until org ready
  });
}

/** ✅ Get one task */
export function useTask(projectId: string, taskId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id
      ? keys.one(organization_id, projectId, taskId)
      : ["tasks", "no-org", taskId],
    queryFn: () => tasksApi.get(organization_id!, projectId, taskId),
    enabled: !!organization_id && !!projectId && !!taskId,
  });
}

/** ✅ Create task */
export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: Partial<Task>) =>
      tasksApi.create(organization_id!, projectId, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.list(organization_id!, projectId) }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Update task */
export function useUpdateTask(projectId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (args: { taskId: string; input: Partial<Task> }) =>
      tasksApi.update(organization_id!, projectId, args.taskId, args.input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: keys.list(organization_id!, projectId) });
      qc.invalidateQueries({
        queryKey: keys.one(organization_id!, projectId, variables.taskId),
      });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Delete task */
export function useDeleteTask(projectId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (taskId: string) =>
      tasksApi.remove(organization_id!, projectId, taskId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.list(organization_id!, projectId) }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Reorder tasks */
export function useReorderTasks(projectId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (items: Array<{ id: string; position: number; parent_id: string | null }>) =>
      tasksApi.reorder(organization_id!, projectId, items),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.list(organization_id!, projectId) }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Get task assignments */
export function useTaskAssignments(projectId: string, taskId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: keys.assignments(organization_id!, projectId, taskId),
    queryFn: () => tasksApi.getAssignments(organization_id!, projectId, taskId),
    enabled: !!organization_id && !!projectId && !!taskId,
  });
}

/** ✅ Assign employees */
export function useAssignEmployeesToTask(projectId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (args: {
      taskId: string;
      assignments: Array<{ employee_id: string; hours: number }>;
    }) =>
      tasksApi.assignEmployees(
        organization_id!,
        projectId,
        args.taskId,
        args.assignments // ✅ send hours per employee
      ),

    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: keys.assignments(organization_id!, projectId, variables.taskId),
      });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}


/** ✅ Comments */
export function useTaskComments(projectId: string, taskId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: keys.comments(organization_id!, projectId, taskId),
    queryFn: () => tasksApi.listComments(organization_id!, projectId, taskId),
    enabled: !!organization_id && !!projectId && !!taskId,
  });
}

export function useAddComment(projectId: string, taskId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: { comment_text: string; parent_comment_id?: string | null }) =>
      tasksApi.addComment(organization_id!, projectId, taskId, input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.comments(organization_id!, projectId, taskId) }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateComment(projectId: string, taskId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (args: { commentId: string; comment_text: string }) =>
      tasksApi.updateComment(organization_id!, projectId, taskId, args.commentId, {
        comment_text: args.comment_text,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.comments(organization_id!, projectId, taskId) }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteComment(projectId: string, taskId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (commentId: string) =>
      tasksApi.deleteComment(organization_id!, projectId, taskId, commentId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.comments(organization_id!, projectId, taskId) }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Comment Attachments */
export function useCommentAttachments(projectId: string, taskId: string, commentId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: ["comment-attachments", organization_id, projectId, taskId, commentId],
    queryFn: () =>
      tasksApi.listCommentAttachments(organization_id!, projectId, taskId, commentId),
    enabled: !!organization_id && !!projectId && !!taskId && !!commentId,
  });
}

export function useUploadCommentAttachment(projectId: string, taskId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (args: { commentId: string; file: File; onProgress?: (p: number) => void }) =>
      tasksApi.uploadCommentAttachment(
        organization_id!,
        projectId,
        taskId,
        args.commentId,
        args.file,
        { onProgress: args.onProgress }
      ),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: [
          "comment-attachments",
          organization_id,
          projectId,
          taskId,
          variables.commentId,
        ],
      }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteCommentAttachment(projectId: string, taskId: string, commentId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      tasksApi.deleteCommentAttachment(
        organization_id!,
        projectId,
        taskId,
        commentId,
        attachmentId
      ),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["comment-attachments", organization_id, projectId, taskId, commentId],
      }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDownloadCommentAttachment(
  projectId: string,
  taskId: string,
  commentId: string
) {
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (attachmentId: string) =>
      tasksApi.downloadCommentAttachment(
        organization_id!,
        projectId,
        taskId,
        commentId,
        attachmentId
      ),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ My Assigned Tasks */
export function useMyAssignedTasks(
  page: number,
  limit: number,
  search?: string,
  sortBy?: string,
  status?: string,
  projectId?: string // ✅ optional project filter
) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: [
      "my-assigned-tasks",
      organization_id,
      page,
      limit,
      search,
      sortBy,
      status,
      projectId, // ✅ include in cache key
    ],
    queryFn: () =>
      tasksApi.myAssignmentsPaginated(
        organization_id!,
        page,
        limit,
        search,
        sortBy,
        status,
        projectId // ✅ forward to backend (if defined)
      ),
    enabled: !!organization_id, // ✅ only run once org id is known
  });
}



// ⬇️ add near your other hooks
export function useUpdateTaskDynamic() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (args: { projectId: string; taskId: string; input: Partial<Task> }) =>
      tasksApi.update(organization_id!, args.projectId, args.taskId, args.input),

    onSuccess: (_data, variables) => {
      // Broadly invalidate project task lists (all pages/filters)
      qc.invalidateQueries({ queryKey: ["tasks", organization_id, variables.projectId] });
      // Also refresh single task cache (if open anywhere)
      qc.invalidateQueries({ queryKey: ["tasks", organization_id, variables.projectId, variables.taskId] });
      // And refresh “My Assigned Tasks”
      qc.invalidateQueries({ queryKey: ["my-assigned-tasks", organization_id] });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/** ✅ Update assignment status (employee updates their task progress) */
export function useUpdateAssignmentStatus() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (args: { assignmentId: string; status: string }) =>
      tasksApi.updateAssignmentStatus(organization_id!, args.assignmentId, args.status),

    onSuccess: () => {
      // Refresh "My Assigned Tasks" list
      qc.invalidateQueries({ queryKey: ["my-assigned-tasks", organization_id] });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useTaskTitleSuggestions() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (args: { projectId: string; search: string }) => {
      if (!args.search || args.search.length < 2) {
        return Promise.resolve([]); // prevent API call
      }

      return tasksApi.getTitleSuggestions(
        organization_id!,
        args.projectId,
        args.search
      );
    },
  });
}