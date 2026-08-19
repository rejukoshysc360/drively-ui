import { Plus, Trash2 } from "lucide-react";

export default function ParticularTable({ items, setItems, disabled }: any){

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
          Particulars
        </h2>

        <button
          onClick={addRow}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl w-full sm:w-auto
            ${disabled ? "bg-gray-300 cursor-not-allowed" : "bg-black text-white"}
          `}
        >
          <Plus className="w-4 h-4" />
          Add Particular
        </button>
      </div>

      {/* ========================= */}
      {/* DESKTOP TABLE */}
      {/* ========================= */}
      <div className="hidden md:block">

        {/* TABLE HEADER */}
        <div className="grid grid-cols-[60px_1fr_140px_140px_80px] font-semibold text-gray-600 border-b pb-2">
          <div>SI</div>
          <div>Particular</div>
          <div>HSN/SAC</div>
          <div className="text-right">Amount</div>
          <div></div>
        </div>

        {/* ✅ HELPER TEXT */}
        {items.length === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Click on "Add Particular" to add a new row
          </p>
        )}

        {/* ROWS */}
        <div className="space-y-3 mt-3">
          {items.map((item: any, index: number) => (
            <div key={item.id} className="border rounded-xl p-4">
              <div className="grid grid-cols-[60px_1fr_140px_140px_80px] gap-3 items-center">
                <div>{index + 1}</div>

                <input
                  className="input"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                />

                <input
                  className="input"
                  placeholder="HSN/SAC"
                  value={item.hsn_sac || ""}
                  onChange={(e) =>
                    updateItem(item.id, "hsn_sac", e.target.value)
                  }
                />

                <input
                  type="number"
                  className="input text-right"
                  value={item.amount ?? 0}
                  onChange={(e) =>
                    updateItem(item.id, "amount", Number(e.target.value) || 0)
                  }
                />

                <button
                  onClick={() => deleteRow(item.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================= */}
      {/* MOBILE CARDS */}
      {/* ========================= */}
      <div className="md:hidden space-y-3">

        {/* ✅ HELPER TEXT (MOBILE) */}
        {items.length === 0 && (
          <p className="text-xs text-gray-500">
            Click on "Add Particular" to add a new row
          </p>
        )}

        {items.map((item: any, index: number) => (
          <div
            key={item.id}
            className="border rounded-xl p-4 space-y-3 shadow-sm"
          >
            {/* TOP */}
            <div className="flex justify-between items-center">
              <p className="font-medium text-sm text-gray-700">
                #{index + 1}
              </p>

              <button
                onClick={() => deleteRow(item.id)}
                className="text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="text-xs text-gray-500">Description</label>
              <input
                className="input w-full"
                placeholder="Enter description"
                value={item.description}
                onChange={(e) =>
                  updateItem(item.id, "description", e.target.value)
                }
              />
            </div>

            {/* HSN + AMOUNT */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">HSN/SAC</label>
                <input
                  className="input w-full"
                  placeholder="HSN"
                  value={item.hsn_sac || ""}
                  onChange={(e) =>
                    updateItem(item.id, "hsn_sac", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Amount</label>
                <input
                  type="number"
                  className="input w-full text-right"
                  value={item.amount ?? 0}
                  onChange={(e) =>
                    updateItem(item.id, "amount", Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}