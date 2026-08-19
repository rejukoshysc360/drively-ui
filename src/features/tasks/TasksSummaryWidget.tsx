import { useMemo } from "react";
import { CheckCircle, Clock, AlertTriangle, Ban, ExternalLink } from "lucide-react";
import { useMyAssignedTasks } from "../tasks/hooks";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

interface Props {
  showHeader?: boolean;
}

export default function TasksSummaryWidget({ showHeader = true }: Props) {
  const navigate = useNavigate();

  const { data, isLoading } = useMyAssignedTasks(
    1,
    100,
    "",
    "end_date_asc",
    "all"
  );

  const assignments = data?.assignments ?? [];

  const summary = useMemo(() => {
    let todo = 0;
    let dueToday = 0;
    let overdue = 0;
    let blocked = 0;

    const today = dayjs().startOf("day");

    assignments.forEach((a: any) => {
      const status = (a.status ?? a.task?.status ?? "todo")
        .toLowerCase()
        .replace(/\s+/g, "_");

      const isDone = status === "done";

      const endDate = a.task?.end_date ? dayjs(a.task.end_date) : null;

      if (isDone) return;

      if (status === "todo") {
        todo++;
      }

      if (status === "blocked") {
        blocked++;
      }

      if (endDate) {
        if (endDate.isSame(today, "day")) {
          dueToday++;
        } else if (endDate.isBefore(today, "day")) {
          overdue++;
        }
      }
    });

    return { todo, dueToday, overdue, blocked };
  }, [assignments]);

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">

      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
              My Tasks
            </h2>
          </div>

          <button
            onClick={() => navigate("/tasks")}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
          >
            View All <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="text-sm text-gray-500 py-4 text-center">
          Loading tasks…
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* BLOCKED */}
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-red-50 border-red-200">
            <div className="p-2 rounded-full bg-red-100">
              <Ban className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <p className="text-xs text-red-700 font-medium">Blocked</p>
              <p className="text-xl font-bold text-red-900">
                {summary.blocked}
              </p>
            </div>
          </div>

          {/* OVERDUE */}
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-amber-50 border-amber-200">
            <div className="p-2 rounded-full bg-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-amber-700 font-medium">Overdue</p>
              <p className="text-xl font-bold text-amber-900">
                {summary.overdue}
              </p>
            </div>
          </div>

          {/* DUE TODAY */}
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-blue-50 border-blue-200">
            <div className="p-2 rounded-full bg-blue-100">
              <Clock className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Due Today</p>
              <p className="text-xl font-bold text-blue-900">
                {summary.dueToday}
              </p>
            </div>
          </div>

          {/* TODO */}
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-yellow-50 border-yellow-200">
            <div className="p-2 rounded-full bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-xs text-yellow-700 font-medium">To Do</p>
              <p className="text-xl font-bold text-yellow-900">
                {summary.todo}
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}