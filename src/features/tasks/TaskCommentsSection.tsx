import React, { useState } from "react";
import dayjs from "dayjs";
import {
  useTaskComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
  useCommentAttachments,
  useUploadCommentAttachment,
  useDeleteCommentAttachment,
  useDownloadCommentAttachment,
} from "./hooks";
import { Paperclip, Download, Info, X, Printer } from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import FormDialog from "../../components/ui/FormDialog";
import { useCan } from "../../utils/permissions"; // ✅ Added RBAC hook
import { useAuth } from "../auth/AuthProvider";

/* ---------------- Types ---------------- */
type Props = {
  projectId: string;
  task: any;
};

type Comment = {
  id: string;
  task_id: string;
  employee_id: string;
  comment_text: string;
  created_at: string;
  parent_comment_id?: string | null;
  employees?: { full_name: string; email: string };
};

const MAX_DEPTH = 5;

/* ---------------- Attachments ---------------- */
const Attachments: React.FC<{
  projectId: string;
  taskId: string;
  commentId: string;
  canUpdate: boolean;
}> = ({ projectId, taskId, commentId, canUpdate }) => {
  const { data: attachments = [] } = useCommentAttachments(projectId, taskId, commentId);
  const deleteAttachment = useDeleteCommentAttachment(projectId, taskId, commentId);
  const downloadAttachment = useDownloadCommentAttachment(projectId, taskId, commentId);

  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const printPresignedUrl = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch file");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const frame = document.createElement("iframe");
      frame.style.position = "fixed";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      frame.src = blobUrl;
      document.body.appendChild(frame);
      frame.onload = () => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(frame);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      };
    } catch {
      toast.error("Print failed");
    }
  };

  const handleDownload = (a: any) => {
    downloadAttachment.mutate(a.id, {
      onSuccess: async ({ url }) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Failed to fetch file");
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = a.file_name || "attachment";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } catch {
          toast.error("Failed to download file");
        }
      },
    });
  };

  const handlePreview = (a: any) => {
    downloadAttachment.mutate(a.id, {
      onSuccess: ({ url }) => setPreviewDoc({ ...a, presignedUrl: url }),
      onError: () => toast.error("Failed to preview"),
    });
  };

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((a: any) => (
        <div
          key={a.id}
          className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-gray-100 px-2 py-1 rounded"
        >
          <span className="truncate">{a.file_name}</span>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <button
              onClick={() => handlePreview(a)}
              className="text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Info className="w-3 h-3" /> Preview
            </button>
            <button
              onClick={() => handleDownload(a)}
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Download
            </button>
            {canUpdate && (
              <button
                onClick={() => setDeleteTarget(a)}
                className="text-red-600 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Preview dialog */}
      {previewDoc && (
        <FormDialog
          open={!!previewDoc}
          title={`Preview — ${previewDoc.file_name}`}
          maxWidth="max-w-2xl"
          onClose={() => setPreviewDoc(null)}
        >
          <div className="h-[70vh] sm:h-[80vh] w-full">
            <iframe src={previewDoc.presignedUrl} className="w-full h-full rounded" />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => printPresignedUrl(previewDoc.presignedUrl)}
              className="btn-primary flex items-center gap-1"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </FormDialog>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Attachment"
        description={`Are you sure you want to delete "${deleteTarget?.file_name}"?`}
        confirmLabel="Delete"
        danger
        isLoading={deleteAttachment.isLoading}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteAttachment.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

/* ---------------- Recursive Thread ---------------- */
const CommentThread: React.FC<any> = ({
  comments,
  parentId = null,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
  task,
  projectId,
  canUpdate,
}) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const uploadAttachment = useUploadCommentAttachment(projectId, task.id);
  const childComments = comments.filter(
    (c: Comment) => (c.parent_comment_id ?? null) === parentId
  );

  if (depth > MAX_DEPTH) return null;

  return (
    <div className="space-y-4">
      {childComments.map((c: Comment) => (
        <div key={c.id} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <img
                src={`https://i.pravatar.cc/40?u=${c.employee_id}`}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 bg-gray-50 rounded-lg p-3 shadow-sm w-full">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="font-medium text-sm">
                    {c.employees?.full_name || "User"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {dayjs(c.created_at).format("YYYY-MM-DD HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1 mb-2 break-words">
                  {c.comment_text}
                </p>

                <div className="flex flex-wrap gap-4 text-xs items-center">
                  {canUpdate && depth < MAX_DEPTH && (
                    <button
                      className="text-indigo-600 hover:underline"
                      onClick={() => setReplyingTo(c.id)}
                    >
                      Reply
                    </button>
                  )}

                  {canUpdate && (
                    <>
                      <label className="flex items-center gap-1 text-gray-500 hover:text-indigo-600 cursor-pointer">
                        <Paperclip className="w-3 h-3" />
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              uploadAttachment.mutate({
                                commentId: c.id,
                                file: e.target.files[0],
                              });
                            }
                          }}
                        />
                      </label>

                      <button
                        className="text-indigo-600 hover:underline"
                        onClick={() =>
                          onEdit(
                            c.id,
                            prompt("Edit comment:", c.comment_text) || c.comment_text
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => onDelete(c.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>

                <Attachments
                  projectId={projectId}
                  taskId={task.id}
                  commentId={c.id}
                  canUpdate={canUpdate}
                />

                {canUpdate && replyingTo === c.id && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="flex-1 border rounded-md px-3 py-2 text-sm bg-white"
                      rows={2}
                    />
                    <button
                      onClick={() => {
                        if (replyText.trim()) {
                          onReply(c.id, replyText);
                          setReplyText("");
                          setReplyingTo(null);
                        }
                      }}
                      className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded"
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Nested replies */}
            {childComments.length > 0 && (
              <div className="ml-3 sm:ml-6 mt-3 relative">
                <div className="absolute left-[-12px] top-0 bottom-0 w-px bg-gray-300" />
                <CommentThread
                  comments={comments}
                  parentId={c.id}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  depth={depth + 1}
                  task={task}
                  projectId={projectId}
                  canUpdate={canUpdate}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ---------------- Main Section ---------------- */
const TaskCommentsSection: React.FC<Props> = ({ task, projectId }) => {
  const can = useCan();
  const canUpdate = can("tasks:update") || can("tasks:update_own_record_only");

  const { profile } = useAuth();
  const roles = Array.isArray(profile?.roles) ? profile.roles : [profile?.roles];
  const slugs = roles.map((r) => r?.slug);
  const isAdmin = slugs.includes("admin");

  // 🚫 If restricted (admin OR cannot update) → show message & exit early
  if (isAdmin || !canUpdate) {
    return (
      <div className="text-gray-500 italic text-sm mb-3 text-center bg-gray-50 border rounded-md py-2">
        Restricted Access — you can view comments but not add, edit, or delete.
      </div>
    );
  }

  // ✅ Otherwise continue with full comment logic
  const [comment, setComment] = useState("");
  const { data: comments = [], isLoading } = useTaskComments(projectId, task.id);
  const addComment = useAddComment(projectId, task.id);
  const updateComment = useUpdateComment(projectId, task.id);
  const deleteComment = useDeleteComment(projectId, task.id);

  return (
    <div>
      <div className="text-sm font-medium mb-2">Comments</div>

      {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}
      {!isLoading && comments.length === 0 && (
        <div className="border-2 border-dashed rounded-lg py-8 text-center text-gray-400 text-sm">
          No comments yet.
        </div>
      )}

      <CommentThread
        comments={comments}
        onReply={(parentId, text) =>
          canUpdate && addComment.mutate({ comment_text: text, parent_comment_id: parentId })
        }
        onEdit={(id, text) =>
          canUpdate && updateComment.mutate({ commentId: id, comment_text: text })
        }
        onDelete={(id) => canUpdate && deleteComment.mutate(id)}
        task={task}
        projectId={projectId}
        canUpdate={canUpdate}
      />

      <div className="flex flex-col sm:flex-row items-start gap-3 mt-4">
        <img src="https://i.pravatar.cc/40" className="w-10 h-10 rounded-full" />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 border rounded-md px-3 py-2 text-sm bg-gray-50 w-full"
          rows={2}
        />
      </div>

      <div className="flex justify-end mt-2">
        <button
          onClick={() => {
            if (comment.trim()) {
              addComment.mutate(
                { comment_text: comment, parent_comment_id: null },
                { onSuccess: () => setComment("") }
              );
            }
          }}
          disabled={addComment.isLoading}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded"
        >
          {addComment.isLoading ? "Posting…" : "Comment"}
        </button>
      </div>
    </div>
  );
};

export default TaskCommentsSection;
