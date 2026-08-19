import { useEffect, useState } from "react";
import {
  useInvoices,
  useDownloadInvoicePDF,
  useGetPresignedUrl,
  useUpdateInvoiceStatus,
  useDeleteInvoice,
} from "./hooks";
import { useClientCompanies } from "../../features/clients/hooks";
import InvoiceCreate from "./InvoiceCreate";
import {
  Download,
  X,
  Pencil,
  Eye,
  Trash2,
  Copy,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { APP_CONFIG } from "../../config/appConfig";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useProjectsByClientId } from "../../features/projects/hooks";

export default function InvoiceList() {
  const [showCreate, setShowCreate] = useState(false);
  const [editInvoice, setEditInvoice] = useState<any>(null);
  const [cloneInvoice, setCloneInvoice] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [projectId, setProjectId] = useState("");
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);

  // ✅ FILTERS
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [payStatus, setPayStatus] = useState("");

  // PAGINATION
  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;

  const { data, isLoading } = useInvoices(
    page,
    limit,
    search,
    clientId,
    projectId,
    undefined,
    fromDate,
    toDate,
    payStatus
  );

  const { data: clientData } = useClientCompanies(1, 50);

  const downloadInvoice = useDownloadInvoicePDF();
  const getPresignedUrl = useGetPresignedUrl();
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();

  const clients = clientData?.client_companies ?? [];

  const { data: projectData } = useProjectsByClientId(clientId);
  const projects = projectData?.projects ?? [];

  useEffect(() => {
    setPage(1);
  }, [search, clientId, fromDate, toDate, payStatus]);

  useEffect(() => {
   setProjectId("");
}, [clientId]);

  // ================= ACTIONS =================

const handleTogglePaid = (inv: any) => {
  updateStatus.mutate({
    invoiceId: inv.id,
    pay_status:
      inv.pay_status === "PAID" ? "PENDING" : "PAID",
  });
};

  const handleView = async (inv: any) => {
    const res = inv.pdf_url
      ? await getPresignedUrl.mutateAsync({
          key: inv.pdf_url,
        })
      : await downloadInvoice.mutateAsync({
          invoiceId: inv.id,
        });

    setPreviewUrl(res.url);
  };

  const handleDownload = async (inv: any) => {
    const res = inv.pdf_url
      ? await getPresignedUrl.mutateAsync({
          key: inv.pdf_url,
        })
      : await downloadInvoice.mutateAsync({
          invoiceId: inv.id,
        });

    const blob = await (await fetch(res.url)).blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${inv.invoice_number}.pdf`;
    link.click();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteInvoice.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  // ================= CREATE VIEW =================
  if (showCreate || editInvoice || cloneInvoice) {
    return (
      <div className="p-4">
        <button
          onClick={() => {
            setShowCreate(false);
            setEditInvoice(null);
            setCloneInvoice(null);
          }}
          className="mb-4 text-sm text-indigo-600"
        >
          ← Back to List
        </button>

        <InvoiceCreate
          invoiceId={editInvoice?.id}
          cloneData={cloneInvoice}
          onSuccess={() => {
            setShowCreate(false);
            setEditInvoice(null);
            setCloneInvoice(null);
          }}
        />
      </div>
    );
  }

  const total = data?.paginationMetaInfo?.totalCount ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6"> 
      {/* HEADER */}
<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
  <h1 className="text-2xl font-bold">Invoices</h1>

  <button
    onClick={() => setShowCreate(true)}
    className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-xl"
  >
    + Add Invoice
  </button>
</div>

      {/* ================= FILTERS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 bg-white border rounded-xl p-4">

        <select
          className="input"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
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
          placeholder="Invoice No"
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

        <select
          className="input"
          value={payStatus}
          onChange={(e) => setPayStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Not Paid</option>
        </select>

        <button
          onClick={() => {
            setSearch("");
            setClientId("");
            setFromDate("");
            setToDate("");
            setPayStatus("");
          }}
          className="px-3 py-2 border rounded text-sm"
        >
          Clear
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white border rounded-xl overflow-hidden hidden md:block">

        {/* HEADER */}
        <div className="grid grid-cols-8 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
          <div>Client</div>
          <div>Project</div>
          <div>Invoice</div>
          <div>Contract</div>
          <div>Date</div>
          <div>Total</div>
          <div>Remaining</div>
          <div className="text-right">Actions</div>
        </div>

        {isLoading ? (
          <p className="p-6 text-center">Loading...</p>
        ) : data?.invoices?.length === 0 ? (
          <p className="p-6 text-center text-gray-500">
            No invoices found
          </p>
        ) : (
        (data?.invoices || []).map((inv: any) => {
            const currency =
              inv.client?.billing_currency || "INR";

            return (
              <div
                key={inv.id}
                className="grid grid-cols-8 px-6 py-4 border-t items-center hover:bg-gray-50"
              >
              <div className="flex flex-col">
                <span className="font-medium">
                  {inv.client?.name}
                </span> 
                <span
                  className={`mt-1 text-[10px] px-2 py-0.5 rounded-full w-fit font-medium
                    ${
                      inv.pay_status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                  {inv.pay_status === "PAID" ? "Paid" : "Pending"}
                </span>
              </div>
                <div className="text-sm text-gray-600">
                  {inv.project?.name || "—"}
                </div> 
                
              <div className="flex items-center gap-2">
                <span>#{inv.invoice_number}</span> 
                {inv.billing_type === "HOURLY" ? (
                  <Clock
                    className="w-4 h-4 text-blue-600"
                  />
                ) : (
                  <FileText
                    className="w-4 h-4 text-green-600"
                  />
                )}
              </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-indigo-600 font-medium">
                    {inv.contract?.contract_code || "—"}
                  </span>

                  {inv.contract?.type && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full w-fit font-medium
                        ${
                          inv.contract.type === "FIXED"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                    >
                      {inv.contract.type === "FIXED" ? "Fixed" : "Recurring"}
                    </span>
                  )}
                  {inv.contract?.type === "RECURRING" && inv.auto_generate_date && (
                  <span className="text-[11px] text-gray-500">
                    Runs on {new Date(inv.auto_generate_date).getDate()}th of every month
                  </span>
                )}

                  {!inv.contract && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 w-fit">
                      No Contract
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-500">
                  {inv.invoice_date}
                </div>

                <div className="font-semibold">
                  {currency} {inv.total.toFixed(2)}
                </div>

                <div>
                 {inv.contract?.type === "FIXED" && inv.remaining !== null && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      {currency} {inv.remaining.toFixed(2)}
                    </span>
                  )}
                </div>

<div className="flex justify-end items-center gap-3">

  {/* ✅ PAID CHECKBOX */}
  <div className="flex items-center gap-2 mr-2">
<div className="flex items-center gap-2">
  {updateStatus.isPending && updateStatus.variables?.invoiceId === inv.id ? (
    <Loader2 className="w-4 h-4 animate-spin text-green-600" />
  ) : (
    <input
      type="checkbox"
      checked={inv.pay_status === "PAID"}
      onChange={() => handleTogglePaid(inv)}
      className="accent-green-600 w-4 h-4 cursor-pointer"
    />
  )}

  <span className="text-xs font-medium text-gray-700">
    Paid
  </span>
</div>
  </div>

  {inv.remaining > 0 && (
    <button
      onClick={() =>
        setCloneInvoice({
          ...inv,
          remaining: inv.remaining,
          billing_type:
            inv.items?.some((i: any) => i.hours)
              ? "HOURLY"
              : "PARTICULAR",
        })
      }
      className="p-2 hover:bg-indigo-50 text-indigo-600 rounded"
    >
      <Copy size={16} />
    </button>
  )}

  <button
    onClick={() => setEditInvoice(inv)}
    className="p-2 hover:bg-gray-100 rounded"
  >
    <Pencil size={16} />
  </button>

  <button
    onClick={() => handleView(inv)}
    className="p-2 hover:bg-gray-100 rounded"
  >
    <Eye size={16} />
  </button>

  <button
    onClick={() => handleDownload(inv)}
    className="p-2 hover:bg-indigo-50 text-indigo-600 rounded"
  >
    <Download size={16} />
  </button>

  <button
    onClick={() => setDeleteTarget(inv)}
    className="p-2 hover:bg-red-50 text-red-600 rounded"
  >
    <Trash2 size={16} />
  </button>

</div>
              </div>
            );
          })
        )}
      </div>
      {/* ================= MOBILE VIEW ================= */}
<div className="md:hidden space-y-4">
  {isLoading ? (
    <p className="text-center py-6">Loading...</p>
  ) : data?.invoices?.length === 0 ? (
    <p className="text-center text-gray-500">No invoices found</p>
  ) : (
   (data?.invoices || []).map((inv: any) => {
      const currency = inv.client?.billing_currency || "INR";

      return (
        <div
          key={inv.id}
          className="bg-white border rounded-xl p-4 shadow-sm space-y-3"
        >
          {/* TOP ROW */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">
                {inv.client?.name}
              </p>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-full
                  ${
                    inv.pay_status === "PAID"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
              >
                {inv.pay_status === "PAID" ? "Paid" : "Pending"}
              </span>
            </div>

            <span className="text-xs text-gray-500">
              {inv.invoice_date}
            </span>
          </div>

          {/* PROJECT */}
          <div className="text-sm text-gray-600">
            {inv.project?.name || "—"}
          </div>

          {/* INVOICE */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              #{inv.invoice_number}
              {inv.billing_type === "HOURLY" ? (
                <Clock className="w-4 h-4 text-blue-600" />
              ) : (
                <FileText className="w-4 h-4 text-green-600" />
              )}
            </div>

            <div className="font-semibold">
              {currency} {inv.total.toFixed(2)}
            </div>
          </div>

          {/* CONTRACT */}
{/* CONTRACT */}
<div className="flex justify-between items-center">
  {inv.contract ? (
    <span className="text-sm text-indigo-600">
      {inv.contract.contract_code}
    </span>
  ) : (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">
      No Contract
    </span>
  )}

  {inv.contract?.type && (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-medium
        ${
          inv.contract.type === "FIXED"
            ? "bg-green-100 text-green-700"
            : "bg-blue-100 text-blue-700"
        }`}
    >
      {inv.contract.type === "FIXED" ? "Fixed" : "Recurring"}
    </span>
  )}
</div>

{/* ✅ NEW LINE BELOW */}
{inv.contract?.type === "RECURRING" && inv.auto_generate_date && (
  <div className="text-[11px] text-gray-500">
    Runs on {new Date(inv.auto_generate_date).getDate()}th of every month
  </div>
)}
          {/* REMAINING */}
          {inv.contract?.type === "FIXED" &&
            inv.remaining !== null && (
              <div className="text-xs text-green-700 font-medium">
                Remaining: {currency}{" "}
                {inv.remaining.toFixed(2)}
              </div>
            )}

          {/* ACTIONS */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t">

            {/* PAID */}
            <div className="flex items-center gap-2">
              {updateStatus.isPending && updateStatus.variables?.invoiceId === inv.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-green-600" />
              ) : (
                <input
                  type="checkbox"
                  checked={inv.pay_status === "PAID"}
                  onChange={() => handleTogglePaid(inv)}
                  className="accent-green-600"
                />
              )}
              <span className="text-xs">Paid</span>
            </div>

            {inv.remaining > 0 && (
              <button
                onClick={() =>
                  setCloneInvoice({
                    ...inv,
                    remaining: inv.remaining,
                    billing_type:
                      inv.items?.some((i: any) => i.hours)
                        ? "HOURLY"
                        : "PARTICULAR",
                  })
                }
                className="p-2 text-indigo-600"
              >
                <Copy size={16} />
              </button>
            )}

            <button onClick={() => setEditInvoice(inv)}>
              <Pencil size={16} />
            </button>

            <button onClick={() => handleView(inv)}>
              <Eye size={16} />
            </button>

            <button onClick={() => handleDownload(inv)}>
              <Download size={16} />
            </button>

            <button
              onClick={() => setDeleteTarget(inv)}
              className="text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      );
    })
  )}
</div>

      {/* PAGINATION */}
     {/* DESKTOP PAGINATION (NUMBERED) */}
{total > limit && (
  <div className="hidden md:flex justify-between items-center mt-4 px-4 py-3 bg-white border rounded-xl">

    {/* LEFT */}
    <button
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={page === 1}
      className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
    >
      ← Previous
    </button>

    {/* CENTER - PAGE NUMBERS */}
    <div className="flex gap-1">
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .slice(
          Math.max(0, page - 3),
          Math.min(totalPages, page + 2)
        )
        .map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1.5 text-sm rounded-lg border
              ${
                p === page
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white hover:bg-gray-100"
              }
            `}
          >
            {p}
          </button>
        ))}
    </div>

    {/* RIGHT */}
    <button
      onClick={() => setPage((p) => p + 1)}
      disabled={page >= totalPages}
      className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
    >
      Next →
    </button>

  </div>
)}
{/* ================= MOBILE PAGINATION ================= */}
{total > limit && (
  <div className="md:hidden mt-4">
    <div className="bg-white border rounded-xl p-4 flex items-center justify-between">

      {/* PREV */}
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
      >
        ← Prev
      </button>

      {/* CURRENT PAGE */}
      <span className="text-sm font-medium text-gray-700">
        {page} / {totalPages}
      </span>

      {/* NEXT */}
      <button
        onClick={() => setPage((p) => p + 1)}
        disabled={page >= totalPages}
        className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
      >
        Next →
      </button>

    </div>
  </div>
)}
      {/* DELETE */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Invoice"
        description={
          deleteTarget
            ? `Delete invoice ${deleteTarget.invoice_number}?`
            : ""
        }
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* PREVIEW */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white w-[95%] h-[90%] rounded-xl overflow-hidden">
            <div className="flex justify-between p-3 bg-black text-white">
              <p>Invoice Preview</p>
              <button onClick={() => setPreviewUrl(null)}>
                <X />
              </button>
            </div>

            <iframe src={previewUrl} className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}