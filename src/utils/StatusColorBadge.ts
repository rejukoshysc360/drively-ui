// ✅ Assignment status color (per-employee progress)
export const getAssignmentStatusColor = (status?: string | null) => {
  const s = (status || "").toLowerCase();
  const map: Record<string, string> = {
    todo: "bg-gray-100 text-gray-600 border-gray-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    done: "bg-emerald-100 text-emerald-700 border-emerald-200",
    blocked: "bg-red-100 text-red-700 border-red-200",
  };
  return map[s] || "bg-gray-100 text-gray-600 border-gray-200";
};
