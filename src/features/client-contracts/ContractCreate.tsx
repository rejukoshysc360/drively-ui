import { useState, useEffect } from "react";
import {
  useCreateContract,
  useUpdateContract,
  useContract,
} from "./hooks";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, ArrowLeft, Loader2 } from "lucide-react";
import ContractForm from "./ContractForm";

export default function ContractCreate() {
  const nav = useNavigate();
  const { id } = useParams(); // ✅ detect edit

  const create = useCreateContract();
  const update = useUpdateContract();
  const { data, isLoading } = useContract(id);

  const isEdit = !!id;

  const [form, setForm] = useState({
    client_id: "",
    project_id: "",
    title: "",
    type: "FIXED",
    total_value: 0,
    recurring_value: 0,
    start_date: "",
    end_date: "",
    notes: "",
    emails: [""], 
  });

  // ✅ PREFILL (EDIT)
  useEffect(() => {
    if (data && isEdit) {
      setForm({
        client_id: data.client_id || "",
        project_id: data.project_id || "",
        title: data.title || "",
        type: data.type || "FIXED",
        total_value: data.total_value || 0,
        recurring_value: data.recurring_value || 0,
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        notes: data.notes || "",
        emails: data.emails?.length ? data.emails : [""]
      });
    }
  }, [data, isEdit]);

  // ✅ VALIDATION
  const isValid =
    form.client_id &&
    form.project_id &&
    form.type &&
    (
      (form.type === "FIXED" && Number(form.total_value) > 0) ||
      (form.type === "RECURRING" && Number(form.recurring_value) > 0)
    );

 // ✅ SUBMIT (CREATE + EDIT)
const submit = async () => {
  if (!isValid) return;

const payload = {
  client_id: form.client_id,
  project_id: form.project_id,
  title: form.title,
  type: form.type,
  start_date: form.start_date || null,
  end_date: form.end_date || null,
  notes: form.notes || null,
  emails: form.emails.filter(e => e.trim() !== ""), 

  // ✅ KEY FIX
  total_value:
    form.type === "FIXED"
      ? Number(form.total_value)
      : null,

  recurring_value:
    form.type === "RECURRING"
      ? Number(form.recurring_value)
      : null,
};

    try {
      if (isEdit) {
        await update.mutateAsync({
          contractId: id,
          body: payload,
        });
      } else {
        await create.mutateAsync(payload);
      }

      nav("/client-contracts");
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ LOADING (EDIT MODE)
  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          {isEdit ? "Edit Contract" : "Create Contract"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit
            ? "Update contract details"
            : "Add a new client contract"}
        </p>
      </div>

      {/* CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 lg:p-8 space-y-6">

        {/* TOP ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-700">
            Contract Details
          </h2>

          <button
            onClick={() => nav("/client-contracts")}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-100 transition w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
        </div>

        {/* FORM */}
        <ContractForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          disabled={
            !isValid ||
            create.isPending ||
            update.isPending
          }
          submitLabel={
            create.isPending || update.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEdit ? "Updating..." : "Saving..."}
              </span>
            ) : isEdit ? (
              "Update Contract"
            ) : (
              "Save Contract"
            )
          }
        />
      </div>
    </div>
  );
}