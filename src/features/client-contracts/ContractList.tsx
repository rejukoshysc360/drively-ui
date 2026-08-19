import { useState, useEffect } from "react";
import { useClientCompanies } from "../../features/clients/hooks";
import { useProjects } from "../../features/projects/hooks";
import {
  useContracts,
  useDeleteContract,
} from "./hooks";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { toast } from "react-hot-toast";
import { APP_CONFIG } from "../../config/appConfig";

export default function ContractList() {
  const nav = useNavigate();

  // ================= STATE =================
  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const del = useDeleteContract();

  // ================= DATA =================
  const { data, isLoading, isFetching } = useContracts(
    page,
    limit,
    search,
    clientId,
    projectId,
    fromDate,
    toDate
  );

  const { data: clientData } = useClientCompanies(1, 50);
  const { data: projectData } = useProjects(1, 100);

  const clients = clientData?.client_companies ?? [];
  const allProjects = projectData?.projects ?? [];

  const projects = allProjects.filter(
    (p: any) => p.client_company_id === clientId
  );

  const rows = data?.contracts ?? [];
  const total = data?.paginationMetaInfo?.totalCount ?? 0;
  const totalPages = Math.ceil(total / limit);

  // ================= RESET PAGE =================
  useEffect(() => {
    setPage(1);
  }, [search, clientId, projectId, fromDate, toDate]);

  // ================= DELETE =================
  const handleDelete = (row: any) => {
    setDeleteTarget(row);
  };

  // ================= UI =================
  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Contracts
          </h1>
          <p className="text-sm text-gray-500">
            Manage client contracts and billing agreements
          </p>
        </div>

        <button
          onClick={() => nav("/client-contracts/create")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Contract
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">

        <select
          className="input"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setProjectId("");
          }}
        >
          <option value="">All Clients</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={projectId}
          disabled={!clientId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">
            {clientId ? "All Projects" : "Select client first"}
          </option>
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search contracts..."
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          className="input"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />

        <input
          type="date"
          className="input"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <button
          onClick={() => {
            setSearch("");
            setClientId("");
            setProjectId("");
            setFromDate("");
            setToDate("");
          }}
          className="px-3 py-2 border rounded text-sm hover:bg-gray-100"
        >
          Clear
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">

        {/* HEADER */}
        <div className="hidden md:grid grid-cols-7 gap-4 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 border-b">
          <div>Contract ID</div>
          <div>Contract</div>
          <div>Project</div>
          <div>Value</div>
          <div>Duration</div>
          <div>Type</div>
          <div className="text-right">Actions</div>
        </div>

        {/* BODY */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-center text-gray-500">
            No contracts found
          </p>
        ) : (
          rows.map((c: any) => {
            const value =
              c.type === "FIXED"
                ? Number(c.total_value || 0)
                : Number(c.recurring_value || 0);

            return (
              <div
                key={c.id}
                className="grid md:grid-cols-7 gap-4 px-4 py-4 border-b last:border-none items-center hover:bg-gray-50 transition"
              >
                <div className="text-xs font-mono text-indigo-600">
                  {c.contract_code || "—"}
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    {c.title}
                  </p>
                </div>

                <div className="text-sm text-gray-700">
                  {c.project?.name || "—"}
                </div>

                {/* ✅ FIXED VALUE DISPLAY */}
                <div className="text-sm font-medium">
                  ₹ {value.toLocaleString()}
                  {c.type === "RECURRING" && (
                    <span className="text-xs text-gray-500 ml-1">
                      /month
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  {c.start_date || "—"} → {c.end_date || "—"}
                </div>

                {/* TYPE BADGE */}
                <div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      c.type === "FIXED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {c.type}
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() =>
                      nav(`/client-contracts/${c.id}/edit`)
                    }
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(c)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* FETCHING */}
        {isFetching && !isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {total > limit && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded"
          >
            ← Previous
          </button>

          <span className="text-sm">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 border rounded flex items-center gap-2"
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Next →"
            )}
          </button>
        </div>
      )}

      {/* DELETE CONFIRM */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Contract"
        description={`Delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        danger
        isLoading={del.isPending}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await del.mutateAsync(deleteTarget.id);
          toast.success("Deleted");
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}