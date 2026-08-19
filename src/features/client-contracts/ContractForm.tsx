import { useClientCompanies } from "../../features/clients/hooks";
import { useProjects } from "../../features/projects/hooks";

export default function ContractForm({
  form,
  setForm,
  onSubmit,
  submitLabel = "Save Contract",
}: any) {
  const { data: clientData } = useClientCompanies(1, 50);
  const clients = clientData?.client_companies ?? [];

  const { data: projectData } = useProjects(1, 100);
  const allProjects = projectData?.projects ?? [];

  const filteredProjects = allProjects.filter(
    (p: any) => p.client_company_id === form.client_id
  );

  // ✅ VALIDATION
  const isValid =
    form.client_id &&
    form.project_id &&
    form.title &&
    form.type &&
    (
      (form.type === "FIXED" && form.total_value > 0) ||
      (form.type === "RECURRING" && form.recurring_value > 0)
    );

  // ✅ SAFE SUBMIT (fix date issue)
  const handleSubmit = () => {
    onSubmit({
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 w-full space-y-6 shadow-sm">

      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          Contract Details
        </h2>
        <p className="text-sm text-gray-500">
          Create and manage client contracts
        </p>
      </div>

      {/* CLIENT + PROJECT */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* CLIENT */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Client
          </label>
          <select
            className="input"
            value={form.client_id}
            onChange={(e) =>
              setForm({
                ...form,
                client_id: e.target.value,
                project_id: "",
              })
            }
          >
            <option value="">Select Client</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* PROJECT */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Project
          </label>
          <select
            className="input"
            value={form.project_id || ""}
            onChange={(e) =>
              setForm({ ...form, project_id: e.target.value })
            }
            disabled={!form.client_id}
          >
            <option value="">Select Project</option>
            {filteredProjects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {!form.client_id && (
            <p className="text-xs text-gray-400 mt-1">
              Select client first
            </p>
          )}
        </div>
      </div>

      {/* CONTRACT INFO */}
      <div className="space-y-4">

        <input
          placeholder="Contract Title"
          className="input"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Contract Type
          </label>
          <select
            className="input"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value })
            }
          >
            <option value="FIXED">Fixed</option>
            <option value="RECURRING">Recurring</option>
          </select>
        </div>

        {/* VALUE */}
        {form.type === "FIXED" && (
          <input
            type="number"
            placeholder="Total Contract Value"
            className="input"
            value={form.total_value}
            onChange={(e) =>
              setForm({
                ...form,
                total_value: Number(e.target.value),
              })
            }
          />
        )}

        {form.type === "RECURRING" && (
          <input
            type="number"
            placeholder="Recurring Amount"
            className="input"
            value={form.recurring_value}
            onChange={(e) =>
              setForm({
                ...form,
                recurring_value: Number(e.target.value),
              })
            }
          />
        )}
      </div>

      {/* DATES */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Start Date
          </label>
          <input
            type="date"
            className="input"
            value={form.start_date}
            onChange={(e) =>
              setForm({ ...form, start_date: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            End Date
          </label>
          <input
            type="date"
            className="input"
            value={form.end_date}
            onChange={(e) =>
              setForm({ ...form, end_date: e.target.value })
            }
          />
        </div>
      </div>

      {/* NOTES */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">
          Notes
        </label>
        <textarea
          className="input min-h-[100px]"
          placeholder="Add any notes..."
          value={form.notes}
          onChange={(e) =>
            setForm({ ...form, notes: e.target.value })
          }
        />
      </div>
      {/* EMAILS */}
<div className="space-y-2">
  <label className="text-xs font-medium text-gray-500 mb-1 block">
    Notification Emails
  </label>

  {(form.emails || [""]).map((email: string, index: number) => (
    <div key={index} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          const updated = [...(form.emails || [""])];
          updated[index] = e.target.value;
          setForm({ ...form, emails: updated });
        }}
        placeholder="Enter email"
        className="input flex-1"
      />

      {(form.emails?.length || 1) > 1 && (
        <button
          type="button"
          onClick={() => {
            const updated = form.emails.filter((_: any, i: number) => i !== index);
            setForm({ ...form, emails: updated });
          }}
          className="px-2 text-red-600"
        >
          ✕
        </button>
      )}
    </div>
  ))}

  <button
    type="button"
    onClick={() =>
      setForm({
        ...form,
        emails: [...(form.emails || [""]), ""],
      })
    }
    className="text-sm text-indigo-600"
  >
    + Add Email
  </button>
</div>

      {/* ACTION */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`px-6 py-3 rounded-xl transition w-full sm:w-auto
            ${isValid
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}