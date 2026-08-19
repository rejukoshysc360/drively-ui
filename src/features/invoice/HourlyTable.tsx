import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function HourlyTable({
  items,
  setItems,
  assignedEmployees = [],
  projectId,
  currency = "INR",
  isEdit = false, // ✅ NEW FLAG
}: any) {

  // =========================
  // 🚫 DO NOT RESET IN EDIT MODE
  // =========================
useEffect(() => {
  if (isEdit) return;
  if (items?.length > 0) return; // ✅ EXTRA SAFETY
  setItems([]);
}, [projectId, isEdit]);

  // =========================
  // 🚫 DO NOT OVERRIDE PREFILLED DATA IN EDIT
  // =========================
useEffect(() => {
  if (isEdit) return;
  if (items?.length > 0) return;
  if (!assignedEmployees?.length) return;

  const mapped = assignedEmployees.map((e: any) => ({
    id: crypto.randomUUID(),
    employee_id: e.employee_id,
    role: e.designation_name
      ? `${e.designation_name} (${e.full_name})`
      : e.role_name
      ? `${e.role_name} (${e.full_name})`
      : e.full_name || "Employee",
    role_name: e.designation_name || e.role_name || null,
    quantity: 1,
    rate: Number(e.billing_rate ?? 0),
    hours: 160,
  }));

  setItems(mapped);
}, [assignedEmployees, isEdit]);

  // =========================
  // ACTIONS
  // =========================
const addRow = () => {
  setItems((prev: any) => [
    ...(prev || []),
    {
      id: crypto.randomUUID(),
      role: "",
      quantity: 1,
      rate: 0,
      hours: 0,
    },
  ]);
};
const deleteRow = (id: string) => {
  setItems((prev: any) =>
    (prev || []).filter((i: any) => i.id !== id)
  );
};

const updateItem = (id: string, field: string, value: any) => {
  setItems((prev: any) =>
    (prev || []).map((item: any) =>
      item.id === id ? { ...item, [field]: value } : item
    )
  );
};

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
        <h2 className="font-semibold text-gray-700">
          Hourly Billing
        </h2>

        <button
          onClick={addRow}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-xl w-full sm:w-auto"
        >
          <Plus size={16} /> Add Row
        </button>
      </div>

      {/* ========================= */}
      {/* DESKTOP TABLE */}
      {/* ========================= */}
      <div className="hidden md:block border rounded-lg overflow-hidden">

        <div className="grid grid-cols-7 bg-gray-100 font-semibold text-sm border-b">
          <div className="p-2 text-center">#</div>
          <div className="p-2">Description</div>
          <div className="p-2 text-center">Qty</div>
          <div className="p-2 text-center">Rate</div>
          <div className="p-2 text-center">Hours</div>
          <div className="p-2 text-right">Amount</div>
          <div className="p-2 text-center">Action</div>
        </div>

        {items.map((item: any, i: number) => {
          const amount =
            (Number(item.quantity) || 0) *
            (Number(item.rate) || 0) *
            (Number(item.hours) || 0);

          return (
            <div
              key={item.id}
              className="grid grid-cols-7 border-b items-center text-sm"
            >
              <div className="p-2 text-center">
                {i + 1}
              </div>

              <div className="p-2 text-gray-700">
                {item.role || "—"}
              </div>

              <div className="p-2 text-center">
                <input
                  type="number"
                  value={item.quantity ?? 0}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "quantity",
                      Number(e.target.value)
                    )
                  }
                  className="w-16 text-center border rounded"
                />
              </div>

              <div className="p-2 text-center">
                <input
                  type="number"
                  value={item.rate ?? 0}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "rate",
                      Number(e.target.value)
                    )
                  }
                  className="w-20 text-center border rounded"
                />
              </div>

              <div className="p-2 text-center">
                <input
                  type="number"
                  value={item.hours ?? 0}
                  onChange={(e) =>
                    updateItem(
                      item.id,
                      "hours",
                      Number(e.target.value)
                    )
                  }
                  className="w-20 text-center border rounded"
                />
              </div>

              <div className="p-2 text-right font-medium">
                {currency} {amount.toFixed(2)}
              </div>

              <div className="p-2 flex justify-center">
                <button
                  onClick={() => deleteRow(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================= */}
      {/* MOBILE CARDS */}
      {/* ========================= */}
      <div className="md:hidden space-y-3">
        {items.map((item: any, i: number) => {
          const amount =
            (Number(item.quantity) || 0) *
            (Number(item.rate) || 0) *
            (Number(item.hours) || 0);

          return (
            <div
              key={item.id}
              className="border rounded-xl p-4 space-y-3 shadow-sm"
            >
              {/* TOP */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">
                    #{i + 1}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.role || "Employee"}
                  </p>
                </div>

                <button
                  onClick={() => deleteRow(item.id)}
                  className="text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* INPUTS */}
              <div className="grid grid-cols-2 gap-3 text-sm">

                <div>
                  <label className="text-xs text-gray-500">
                    Qty
                  </label>
                  <input
                    type="number"
                    value={item.quantity ?? 0}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">
                    Rate
                  </label>
                  <input
                    type="number"
                    value={item.rate ?? 0}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "rate",
                        Number(e.target.value)
                      )
                    }
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500">
                    Hours
                  </label>
                  <input
                    type="number"
                    value={item.hours ?? 0}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "hours",
                        Number(e.target.value)
                      )
                    }
                    className="input w-full"
                  />
                </div>

                <div className="flex items-end justify-end">
                  <p className="font-semibold text-sm">
                    {currency} {amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}