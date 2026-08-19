import { useEffect, useRef, useState, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Users } from "lucide-react";
import {
  useEmployeesActiveDirectory,
  useEmployeePhotoUrl,
} from "../employees/hooks";
import { APP_CONFIG } from "../../config/appConfig";

// ─────────────────────────────
// Debounce hook
// ─────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// ─────────────────────────────
// Employee Row
// ─────────────────────────────
const EmployeeListItem = memo(
  ({
    emp,
    photoCache,
    onPhotoLoad,
  }: {
    emp: any;
    photoCache: Record<string, string>;
    onPhotoLoad: (id: string, url: string) => void;
  }) => {
    const navigate = useNavigate();
    const safeId = emp?.id;
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [showSpinner, setShowSpinner] = useState(false);
    const attemptRef = useRef(false);

    const { mutateAsync } = useEmployeePhotoUrl(safeId || "");

    useEffect(() => {
      if (!safeId || attemptRef.current) return;
      attemptRef.current = true;
      setShowSpinner(true);

      mutateAsync(undefined)
        .then((res) => {
          if (res?.url) {
            setImgSrc(res.url);
            onPhotoLoad(safeId, res.url);
          }
        })
        .catch(() => setImgSrc(null))
        .finally(() => setShowSpinner(false));
    }, [safeId, mutateAsync, onPhotoLoad]);

    useEffect(() => {
      if (photoCache[safeId] && photoCache[safeId] !== imgSrc) {
        setImgSrc(photoCache[safeId]);
      }
    }, [photoCache, safeId, imgSrc]);

    return (
      <div
        onClick={() => navigate(`/directory/${safeId}`)}
        className="flex items-center gap-4 p-5 hover:bg-indigo-50/70 transition cursor-pointer border-b border-gray-100 last:border-none"
      >
        {/* 👤 Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-[10px]">
            {showSpinner ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            ) : imgSrc ? (
              <img
                src={imgSrc}
                alt={emp.full_name || "Employee"}
                className="object-cover w-full h-full rounded-full"
                onError={() => setImgSrc(null)}
              />
            ) : (
              <span>No Photo</span>
            )}
          </div>
        </div>

        {/* 📋 Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {emp.full_name || "—"}
          </h3>
          <p className="text-sm text-gray-600 truncate">{emp.email || "—"}</p>
          <p className="text-xs text-gray-500 mt-1">
            {emp.designation_title || "—"}
            {emp.department_name ? ` • ${emp.department_name}` : ""}
          </p>
        </div>
      </div>
    );
  }
);

// ─────────────────────────────
// Main Component
// ─────────────────────────────
export default function EmployeeSearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const [page, setPage] = useState(1);
  const limit = APP_CONFIG.PAGE_SIZE;
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data, isFetching, isLoading } = useEmployeesActiveDirectory(
    page,
    limit,
    debouncedQuery,
    "all"
  );

  const [employees, setEmployees] = useState<any[]>([]);
  const [photoCache, setPhotoCache] = useState<Record<string, string>>({});

  useEffect(() => {
    setEmployees([]);
    setPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    if (data?.employees) {
      setEmployees((prev) =>
        page === 1 ? data.employees : [...prev, ...data.employees]
      );
      if (page > 1 && resultsRef.current) {
        setTimeout(() => {
          resultsRef.current?.scrollTo({
            top: resultsRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 80);
      }
    }
  }, [data?.employees, page]);

  const handlePhotoLoad = useCallback((id: string, url: string) => {
    setPhotoCache((prev) => ({ ...prev, [id]: url }));
  }, []);

  const handleLoadMore = () => {
    const totalPages = data?.paginationMetaInfo?.totalPages ?? 1;
    if (page < totalPages && !isFetching) setPage((p) => p + 1);
  };

  return (
<div className="p-4 sm:p-6 lg:p-8 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
  <div className="space-y-10">
        {/* 🧭 Page Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Employee Directory
          </h1>
          <p className="text-slate-600 mt-1 text-base">
            Search and explore all employees in your organization.
          </p>
        </div>

        {/* 🔍 Search Filter Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Employees
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, or department..."
              className="w-full h-12 pl-12 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base transition"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            {isFetching && query && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-indigo-500" />
            )}
          </div>
        </div>

        {/* 📋 Employee List */}
        <div
          ref={resultsRef}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100"
        >
          {isLoading && page === 1 && (
            <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mb-3 text-indigo-500" />
              Loading employees...
            </div>
          )}

          {!isLoading && employees.length === 0 && !isFetching && (
            <div className="p-16 text-center text-gray-500">
              <Search className="w-10 h-10 text-gray-300 mb-4 mx-auto" />
              <p className="text-lg font-medium">No employees found</p>
              <p className="text-sm mt-1 text-gray-400">
                Try adjusting your search terms.
              </p>
            </div>
          )}

          {employees.map((emp) => (
            <EmployeeListItem
              key={emp.id}
              emp={emp}
              photoCache={photoCache}
              onPhotoLoad={handlePhotoLoad}
            />
          ))}

          {isFetching && page > 1 && (
            <div className="p-6 text-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-500" />
            </div>
          )}
        </div>

        {/* 🔽 Load More */}
        {data?.paginationMetaInfo &&
          page < data.paginationMetaInfo.totalPages && (
            <div className="flex justify-center pt-8">
              <button
                onClick={handleLoadMore}
                disabled={isFetching}
                className="px-6 py-3 text-sm font-medium border border-gray-300 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
