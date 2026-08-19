import { useState, useEffect } from "react";
import {
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useAnnouncementImageUrl,
} from "./hooks";
import FormDialog from "../../components/ui/FormDialog";
import SlateEditor from "./SlateEditor";

export default function HrAnnouncementDialog({ open, announcement, onClose }) {
  const isEdit = !!announcement;

  const [title, setTitle] = useState(announcement?.title || "");
  const [content, setContent] = useState(announcement?.content_html || "");
  const [scheduledDate, setScheduledDate] = useState(
    announcement?.scheduled_at?.split("T")[0] || ""
  );
  const [scheduledTime, setScheduledTime] = useState(
    announcement?.scheduled_at?.split("T")[1]?.slice(0, 5) || ""
  );

  const [endDate, setEndDate] = useState(
    announcement?.end_at?.split("T")[0] || ""
  );
  const [endTime, setEndTime] = useState(
    announcement?.end_at?.split("T")[1]?.slice(0, 5) || ""
  );

const [isActive, setIsActive] = useState(
  announcement ? announcement.is_active : true
);

  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement(announcement?.id);
  const getImageUrl = useAnnouncementImageUrl();

  const isSubmitting = create.isPending || update.isPending;

  /* -------------------------------------------------------------------------- */
  /* 🧩 Resolve S3 keys to presigned URLs before showing in editor (Edit mode) */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    async function resolveImages() {
      if (!announcement?.content_html) return;

      let html = announcement.content_html;

      const regex = /data-s3key:[^"' >]+/g;
      const matches = html.match(regex) || [];

      if (matches.length === 0) return;

      for (const match of matches) {
        const key = match.replace("data-s3key:", "");

        try {
          const { url } = await getImageUrl.mutateAsync(key);
          html = html.replace(match, url);
        } catch (err) {
          console.error("Failed to resolve image URL", err);
        }
      }

      setContent(html);
    }

    resolveImages();
  }, [announcement]);

  /* -------------------------------------------------------------------------- */
  /* 📨 Save / Update handler                                                   */
  /* -------------------------------------------------------------------------- */

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const scheduled_at =
      scheduledDate && scheduledTime
        ? `${scheduledDate}T${scheduledTime}:00Z`
        : scheduledDate
        ? `${scheduledDate}T00:00:00Z`
        : null;

    const end_at =
      endDate && endTime
        ? `${endDate}T${endTime}:00Z`
        : endDate
        ? `${endDate}T23:59:59Z`
        : null;

    const payload = {
      title,
      content_html: content,
      scheduled_at,
      end_at,
      is_active: isActive,
    };

    if (isEdit) {
      await update.mutateAsync(payload);
    } else {
      await create.mutateAsync(payload);
    }

    onClose();
  };

  /* -------------------------------------------------------------------------- */
  /* 🧱 UI Layout                                                               */
  /* -------------------------------------------------------------------------- */

  return (
    <FormDialog
      open={open}
      title={isEdit ? "Edit Announcement" : "New Announcement"}
      onClose={onClose}
    >
      <div className="space-y-4">

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-gray-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 border rounded-lg p-2"
            placeholder="Enter announcement title"
          />
        </div>

        {/* Content */}
        <div>
          <label className="text-sm font-medium text-gray-700">Content</label>
          <SlateEditor value={content} onChange={setContent} />
        </div>

        {/* Start date/time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>
        </div>

        {/* End date/time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>
        </div>

        {/* Active checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label className="text-sm text-gray-700">Active</label>
        </div>

        {/* Footer buttons */}
        <div className="pt-4 flex justify-end gap-3 border-t">

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${
              isSubmitting
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSubmitting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}

            {isSubmitting
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
              ? "Update"
              : "Save"}
          </button>

        </div>
      </div>
    </FormDialog>
  );
}