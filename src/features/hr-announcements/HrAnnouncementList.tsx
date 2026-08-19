import { useState } from "react";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import FormDialog from "../../components/ui/FormDialog";
import { useHrAnnouncements, useDeleteAnnouncement } from "./hooks";
import { Loader2, PlusCircle, Search, Trash2, Eye, Pencil } from "lucide-react";
import DataTable from "../../components/ui/DataTable";
import HrAnnouncementDialog from "./HrAnnouncementDialog";
import { useAuth } from "../../features/auth/AuthProvider";
import { APP_CONFIG } from "../../config/appConfig";

export default function HrAnnouncementList() {
  const limit = APP_CONFIG.PAGE_SIZE;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);

  const [openView, setOpenView] = useState(false);
  const [viewItem, setViewItem] = useState<any | null>(null);

  const { data, isFetching, isLoading } = useHrAnnouncements(page, limit, search);
  const deleteAnnouncement = useDeleteAnnouncement();
  const { profile } = useAuth();

  const rows = data?.announcements ?? [];

  // ────────────────────────────────
  // 🌍 Determine org timezone
  // ────────────────────────────────
  const orgCountry =
    profile?.organization?.country_code ||
    profile?.organizations?.country_code ||
    profile?.country_code ||
    "AE";

  const orgTimezone =
    orgCountry.toUpperCase() === "AE"
      ? "Asia/Dubai"
      : orgCountry.toUpperCase() === "IN"
      ? "Asia/Kolkata"
      : orgCountry.toUpperCase() === "US"
      ? "America/New_York"
      : "UTC";
 


const formatDateTimeTZ = (iso: string | null) => {
  if (!iso) return "—";
  try {
    // Parse ISO string from DB (e.g., "2026-02-06T16:25:00+00")
    const dt = iso.replace("T", " ").replace("Z", "");
    const formatted = dt.split("+")[0]; // remove offset
    // Show just date + time, no UTC shift
    return `${formatted}`;
  } catch {
    return "—";
  }
};



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">HR Announcements</h1>
        <button
          onClick={() => {
            setSelected(null);
            setOpenDialog(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <PlusCircle className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search announcements..."
          className="w-full h-10 pl-10 pr-10 border rounded-lg shadow-sm border-gray-300"
        />
        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        {isFetching && (
          <Loader2 className="absolute right-3 top-2.5 w-5 h-5 animate-spin text-gray-400" />
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
<DataTable
  data={rows}
  columns={[
    { header: "Title", accessorKey: "title" },
    {
      header: "Scheduled",
      accessorFn: (r: any) => formatDateTimeTZ(r.scheduled_at),
    },
    {
      header: "End At", // ✅ new column
      accessorFn: (r: any) => formatDateTimeTZ(r.end_at),
    },
    {
      header: "Active",
      accessorFn: (r: any) => (r.is_active ? "Active" : "Inactive"),
    },
    {
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-3">
          {/* 👁️ View */}
          <button
            onClick={() => {
              setViewItem(row.original);
              setOpenView(true);
            }}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Eye className="w-4 h-4" /> View
          </button>

          {/* ✏️ Edit */}
          <button
            onClick={() => {
              setSelected(row.original);
              setOpenDialog(true);
            }}
            className="text-amber-600 hover:text-amber-800 flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>

          {/* 🗑️ Delete */}
          <button
            onClick={() => {
              setPendingDelete(row.original);
              setConfirmOpen(true);
            }}
            className="text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      ),
    },
  ]}
  total={data?.paginationMetaInfo?.totalCount ?? 0}
  page={page}
  limit={limit}
  onPageChange={setPage}
  isFetching={isFetching}
/>

      </div>

      {/* Add/Edit Dialog */}
      {openDialog && (
        <HrAnnouncementDialog
          open={openDialog}
          announcement={selected}
          onClose={() => {
            setOpenDialog(false);
            setSelected(null);
          }}
        />
      )}

      {/* 👁️ View Content Dialog */}
      {openView && viewItem && (
        <FormDialog
          open={openView}
          title={viewItem.title}
          onClose={() => {
            setOpenView(false);
            setViewItem(null);
          }}
        >
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: viewItem.content_html }} />
          </div>
          <div className="mt-4 text-sm text-gray-500 space-y-1">
            <p>
              <strong>Scheduled:</strong> {formatDateTimeTZ(viewItem.scheduled_at)}
            </p>
            <p>
              <strong>Status:</strong> {viewItem.is_active ? "Active" : "Inactive"}
            </p>
          </div>
        </FormDialog>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Announcement"
        description={`Are you sure you want to delete “${pendingDelete?.title}”?`}
        confirmLabel="Delete"
        danger
        isLoading={deleteAnnouncement.isPending}
        onConfirm={() => {
          if (!pendingDelete?.id) return;
          deleteAnnouncement.mutate(pendingDelete.id, {
            onSuccess: () => setConfirmOpen(false),
          });
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
