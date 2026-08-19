// src/pages/employee/expenses/components/HeaderSection.tsx
import { Plus, Loader2, ChartNoAxesCombined } from "lucide-react";

interface Props {
  activeDate: string;
  setActiveDate: (date: string) => void;
  canCreate: boolean;
  addExpenseLoading: boolean;
  handleAddExpense: () => void;
}

export default function HeaderSection({ 
  activeDate, 
  setActiveDate, 
  canCreate, 
  addExpenseLoading, 
  handleAddExpense 
}: Props) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
          <ChartNoAxesCombined className="w-8 h-8 md:w-9 md:h-9 text-indigo-600" />
          My Expense Manager
        </h1>
        <p className="text-slate-600 mt-2 text-base md:text-lg">Manage your expenses</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <input
          type="date"
          value={activeDate}
          onChange={(e) => setActiveDate(e.target.value)}
          className="input w-full md:max-w-xs"
        />

        {canCreate && (
          <button
            onClick={handleAddExpense}
            disabled={addExpenseLoading}
            className={`flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium text-white transition-all duration-200 w-full md:w-auto shadow-md ${
              addExpenseLoading
                ? "bg-indigo-400 cursor-wait opacity-90"
                : "bg-black hover:bg-gray-800 hover:shadow-lg active:scale-95"
            }`}
          >
            {addExpenseLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Adding row...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Add Expense</span>
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
}