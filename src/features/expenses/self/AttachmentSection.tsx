// src/pages/employee/expenses/components/AttachmentSection.tsx
import { Upload, FileText, X } from "lucide-react";

interface Props {
  expense: any;
  locked: boolean;
  isDesktop?: boolean;
  // From sharedProps
  canCreate: boolean;
  uploadProgress: Record<string, number>;
  filePickers: any;
  dragCounter: any;
  uploadAttachmentMutation: any;
  previewAttachmentMutation: any;
  setPreviewSrc: (src: string) => void;
  setPreviewName: (name: string) => void;
  setDeleteAttachmentTarget: (target: any) => void;
  canDelete: boolean;
}

export default function AttachmentSection({ expense, locked, isDesktop = false, ...props }: Props) {
  const progress = props.uploadProgress[expense.id] ?? 0;

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    props.dragCounter.current[expense.id] = (props.dragCounter.current[expense.id] || 0) + 1;
    (e.currentTarget as HTMLElement).classList.add("border-blue-400", "bg-blue-50");
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    props.dragCounter.current[expense.id]--;
    if (props.dragCounter.current[expense.id] === 0) {
      (e.currentTarget as HTMLElement).classList.remove("border-blue-400", "bg-blue-50");
    }
  };
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  props.dragCounter.current[expense.id] = 0;
  const file = e.dataTransfer.files[0];
  if (file)
    props.uploadAttachmentMutation.mutate({
      expense_id: expense.id,
      file,
      onProgress: (p: number) => {
        props.setUploadProgress?.((prev: any) => ({
          ...prev,
          [expense.id]: p,
        }));
      },
    });
};

const isUploading = progress > 0 && progress < 100;

  return (
  <div className={isDesktop ? "" : "mt-3 space-y-3"}>
{isUploading && (
  <div className="mb-3 bg-yellow-50 border border-blue-200 rounded-lg p-2 overflow-hidden">
    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className="absolute inset-0 w-1/3 bg-blue-600 rounded-full animate-[slide_1.2s_ease-in-out_infinite]" />
    </div>
    <style>
      {`
        @keyframes slide {
          0% { left: -30%; }
          50% { left: 100%; }
          100% { left: -30%; }
        }
      `}
    </style>
    <p className="text-blue-600 text-xs font-medium mt-1 text-center">Uploading...</p>
  </div>
)}



      {props.canCreate && !locked && (
        <label
          className={`flex flex-col items-center justify-center gap-3 ${isDesktop ? "px-4 py-3" : "p-8"} border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 text-gray-600`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className={isDesktop ? "w-5 h-5" : "w-10 h-10"} />
          <span className="text-sm font-medium text-center">
            {isDesktop ? "Drop or click" : "Drop file or tap to upload"}
          </span>
         <input
          type="file"
          ref={(el) => (props.filePickers.current[expense.id] = el)}
          className="hidden"
          accept="image/*,.pdf"
         onChange={(e) => {
  const fileInput = e.target;
  const file = fileInput.files?.[0];

  if (file) {
    props.uploadAttachmentMutation.mutate(
      { expense_id: expense.id, file },
      {
        onSettled: () => {
          // ✅ Reset input so same file name can be selected again
          fileInput.value = "";
        },
      }
    );
  }
}}


        />

        </label>
      )}

      {(expense.attachments || []).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {expense.attachments.map((att: any) => (
            <div key={att.id} className="group relative bg-gray-50 border rounded-lg px-4 py-3 pr-12">
              <FileText className="w-5 h-5 text-indigo-600 inline-block mr-2" />
              <button
                onClick={() => props.previewAttachmentMutation.mutate(
                  { expense_id: expense.id, attachment_id: att.id },
                  { onSuccess: (res: any) => { props.setPreviewSrc(res.url); props.setPreviewName(att.filename || "attachment"); }}
                )}
                className="text-sm text-blue-700 hover:underline"
              >
                {att.filename || "Attachment"}
              </button>
              {props.canDelete && !locked && (
                <button
                  onClick={() => props.setDeleteAttachmentTarget({ expenseId: expense.id, attachmentId: att.id })}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 hover:bg-red-50"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}