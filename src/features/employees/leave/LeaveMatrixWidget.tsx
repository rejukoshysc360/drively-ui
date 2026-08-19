import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, Maximize2, Minimize2 } from "lucide-react";
import { useExportLeaveMatrix, useMonthlyLeaveMatrix } from "../leave/hooks";

export default function LeaveMatrixWidget() {
  const [month, setMonth] = useState(
    () => new Date().toISOString().slice(0, 7)
  );

  const isCrossOrg = true;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [page, setPage] = useState(1);

  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [hasMoreState, setHasMoreState] = useState(false);

  const [legendMapState, setLegendMapState] = useState<
    Record<string, string>
  >({});

  const [zoomed, setZoomed] = useState(false);

  const exportMatrix = useExportLeaveMatrix();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useMonthlyLeaveMatrix(
    month,
    debouncedSearch,
    page,
    10,
    isCrossOrg
  );

  useEffect(() => {
    if (data?.dates?.length) {
      setAllDates(data.dates);
    }
  }, [data?.dates]);

  useEffect(() => {
    if (data?.pagination) {
      setHasMoreState(data.pagination.hasMore);
    }
  }, [data?.pagination]);

  useEffect(() => {
    if (!data?.legend) return;

    setLegendMapState((prev) => {
      const merged = { ...prev };

      Object.entries(data.legend).forEach(([code, label]) => {
        const cleanLabel = (label as string).trim();

        if (!merged[code] || cleanLabel.length > merged[code].length) {
          merged[code] = cleanLabel;
        }
      });

      return merged;
    });
  }, [data?.legend]);

  useEffect(() => {
    if (!data?.data) return;

    if (page === 1) {
      setAllEmployees(data.data);
      return;
    }

    setAllEmployees((prev) => {
      const existingIds = new Set(
        prev.map((e) => e.employee_id)
      );

      const newItems = data.data.filter(
        (e: any) => !existingIds.has(e.employee_id)
      );

      return [...prev, ...newItems];
    });
  }, [data?.data, page]);

  useEffect(() => {
    setPage(1);
    setAllEmployees([]);
  }, [month, debouncedSearch]);

  const employees = allEmployees;
  const dates = allDates;

  const isInitialLoading = isLoading && page === 1;

  const getCellStyle = (val: string) => {
    if (!val) return "bg-white";

    if (val === "W") {
      return "bg-slate-100 text-slate-600";
    }

    if (val === "H") {
      return "bg-purple-100 text-purple-700";
    }

    if (val === "O") {
      return "bg-gray-300 text-gray-700";
    }

    const isPending = val.includes("*");
    const clean = val.replace("*", "");

    if (clean.includes("-")) {
      const [base] = clean.split("-");

      if (legendMapState[base]) {
        return isPending
          ? "bg-red-100 text-red-800 border border-red-300 font-medium"
          : "bg-red-100 text-red-700 font-medium";
      }
    }

    if (clean.includes("/")) {
      const [a, b] = clean.split("/");

      if (legendMapState[a] || legendMapState[b]) {
        return isPending
          ? "bg-red-100 text-red-800 border border-red-300 font-medium"
          : "bg-red-100 text-red-700 font-medium";
      }

      return "bg-indigo-100 text-indigo-700";
    }

    if (legendMapState[clean]) {
      return isPending
        ? "bg-red-100 text-red-800 border border-red-300"
        : "bg-red-100 text-red-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  const getLegendLabel = (code: string) => {
    if (!code) return "";

    if (code === "W") return "Working Day";
    if (code === "H") return "Holiday";
    if (code === "O") return "Weekly Off";

    const isPending = code.includes("*");

    const cleanCode = code.replace("*", "");

    if (cleanCode.includes("-")) {
      const [base, half] = cleanCode.split("-");

      const label = legendMapState[base]?.trim() || base;

      let halfLabel = "";

      if (half === "M") halfLabel = "Morning";
      if (half === "A") halfLabel = "Afternoon";

      const fullLabel = halfLabel
        ? `${label} (${halfLabel})`
        : label;

      return isPending
        ? `${fullLabel} (Pending)`
        : fullLabel;
    }

    if (cleanCode.includes("/")) {
      const [a, b] = cleanCode.split("/");

      return `${getLegendLabel(a)} / ${getLegendLabel(b)}`;
    }

    const labelFromBackend = legendMapState[cleanCode];

    if (labelFromBackend) {
      return isPending
        ? `${labelFromBackend.trim()} (Pending)`
        : labelFromBackend.trim();
    }

    return cleanCode;
  };

  const legend = useMemo(() => {
    const set = new Set<string>();

    employees.forEach((emp) => {
      Object.values(emp.matrix || {}).forEach((val: any) => {
        if (!val) return;

        const clean = val.replace("*", "");

        if (clean.includes("/")) {
          clean.split("/").forEach((v) => set.add(v));
        } else {
          set.add(clean);
        }
      });
    });

    return Array.from(set);
  }, [employees]);

  const handleExportMatrix = async () => {
    try {
      setIsExporting(true);

      const blob = await exportMatrix.mutateAsync({
        month,
        search: debouncedSearch,
        crossOrg: isCrossOrg,
      });

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = `LeaveMatrix_${month}.xlsx`;

      a.click();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const renderTable = () => (
    <div className="overflow-auto relative bg-white">
      <div className="min-w-[1200px]">
        <table className="w-full border-separate border-spacing-0 text-xs table-fixed">
          <thead>
            <tr>
              <th className="sticky left-0 z-40 bg-white p-0 min-w-[240px] w-[240px] relative">
                <div className="bg-white border border-slate-200 p-3 relative z-10 font-semibold text-left h-[56px] flex items-center">
                  Employee
                </div>
              </th>

              {dates.map((d) => {
                const date = new Date(d);

                return (
                  <th
                    key={d}
                    className="border border-slate-200 bg-white text-center min-w-[56px] w-[56px] h-[56px]"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[11px] text-slate-500">
                        {date.toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </span>

                      <span className="font-semibold">
                        {date.getDate()}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {employees.map((emp) => (
              <tr key={emp.employee_id}>
                <td className="sticky left-0 z-30 bg-white p-0 min-w-[240px] w-[240px] relative">
                  <div className="bg-white border border-slate-200 px-4 py-3 relative z-10 flex items-center gap-2 h-[56px] whitespace-nowrap">
                    <span>
                      {emp.country_code === "IN"
                        ? "🇮🇳"
                        : emp.country_code === "AE"
                        ? "🇦🇪"
                        : "🏢"}
                    </span>

                    <span className="truncate font-medium text-slate-800">
                      {emp.name}
                    </span>
                  </div>
                </td>

                {dates.map((d) => {
                  const val = emp.matrix[d];

                  return (
                    <td
                      key={d}
                      className="border border-slate-200 text-center bg-white min-w-[56px] w-[56px] h-[56px] p-[2px]"
                    >
                      <div className="flex items-center justify-center w-full h-full">
                        <span
                          title={val}
                          className={`inline-flex items-center justify-center w-full h-[32px] px-1 rounded-md text-[10px] font-semibold leading-none truncate overflow-hidden whitespace-nowrap ${getCellStyle(
                            val
                          )}`}
                        >
                          {val}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMobileView = () => (
  <div className="space-y-3">
    {employees.map((emp) => (
      <div
        key={emp.employee_id}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
      >
        {/* EMPLOYEE HEADER */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <span className="text-lg">
            {emp.country_code === "IN"
              ? "🇮🇳"
              : emp.country_code === "AE"
              ? "🇦🇪"
              : "🏢"}
          </span>

          <span className="font-semibold text-slate-800 truncate">
            {emp.name}
          </span>
        </div>

        {/* DAYS */}
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-2 px-3 py-3">
            {dates.map((d) => {
              const val = emp.matrix[d];

              const date = new Date(d);

              return (
                <div
                  key={d}
                  className="flex flex-col items-center min-w-[52px]"
                >
                  <span className="text-[10px] text-slate-400">
                    {date.toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </span>

                  <span className="text-[11px] font-semibold text-slate-700 mb-1">
                    {date.getDate()}
                  </span>

                  <span
                    className={`
                      inline-flex items-center justify-center
                      h-[32px]
                      min-w-[40px]
                      rounded-lg
                      px-2
                      text-[11px]
                      font-semibold
                      whitespace-nowrap
                      ${getCellStyle(val)}
                    `}
                  >
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    ))}
  </div>
);

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
      <div className="px-4 sm:px-6 md:px-8 pt-6 pb-4 border-b border-slate-100">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
              </div>

              <h2 className="text-xl font-bold text-slate-800">
                Monthly Leave Matrix
              </h2>
            </div>

            <button
              onClick={() => setZoomed((z) => !z)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
            >
              {zoomed ? (
                <>
                  <Minimize2 size={16} /> Exit
                </>
              ) : (
                <>
                  <Maximize2 size={16} /> Zoom
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />

              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />

            <button
              onClick={handleExportMatrix}
              disabled={isExporting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm disabled:opacity-50"
            >
              {isExporting ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {isInitialLoading ? (
          <div className="text-center py-10 text-slate-500">
            Loading matrix...
          </div>
        ) : (
          <>
          {/* DESKTOP TABLE */}
          <div className="hidden sm:block">
            {renderTable()}
          </div>

          {/* MOBILE CARDS */}
          <div className="sm:hidden">
            {renderMobileView()}
          </div>

            {hasMoreState && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isFetching ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}

            <div className="mt-8 border-t pt-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Legend
              </p>

              <div className="flex flex-wrap gap-4">
                {legend.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      title={item}
                      className={`inline-flex items-center justify-center min-w-[44px] max-w-[90px] h-[30px] rounded-md px-2 text-[11px] font-semibold truncate overflow-hidden whitespace-nowrap ${getCellStyle(
                        item
                      )}`}
                    >
                      {item}
                    </span>

                    <span className="text-slate-600">
                      {getLegendLabel(item)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!isLoading &&
          !isFetching &&
          employees.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              No employees found
            </div>
          )}
      </div>

      {zoomed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full h-full flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">
                Monthly Leave Matrix
              </h3>

              <button
                onClick={() => setZoomed(false)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
              >
                <Minimize2 size={16} /> Close
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto bg-white">
             {/* DESKTOP TABLE */}
          <div className="hidden sm:block">
            {renderTable()}
          </div>

          {/* MOBILE CARDS */}
          <div className="sm:hidden">
            {renderMobileView()}
          </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}