import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Search,
  UserCog,
} from "lucide-react";

import { useAssignableEmployees } from "./hooks";
import { APP_CONFIG } from "../../config/appConfig";

type Props = {
  selectedEmployee: any;
  onSelect: (emp: any) => void;
};

export default function EmployeeListPanel({
  selectedEmployee,
  onSelect,
}: Props) {
  const [page, setPage] =
    useState(1);

  const [search, setSearch] =
    useState("");

  const limit = APP_CONFIG.PAGE_SIZE;

  const {
    data,
    isLoading,
    isFetching,
  } = useAssignableEmployees(
    page,
    limit,
    search,

    // ✅ allowed roles
    [
      "admin",
      "hr",
      "manager",
    ]
  );

  // ✅ Reset page on search
  useEffect(() => {
    setPage(1);
  }, [search]);

  const employees =
    data?.employees ?? [];

  const pagination =
    data?.paginationMetaInfo;

  const totalPages =
    pagination?.totalPages ?? 1;

  const currentPage =
    pagination?.currentPage ??
    page;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">
          Employees
        </h2>

        <div className="relative mt-4">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search employee..."
            className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />

          {isFetching &&
            !isLoading && (
              <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-indigo-500" />
            )}
        </div>
      </div>

      {/* Employee List */}
      <div className="divide-y divide-gray-100 min-h-[500px]">
        {isLoading && (
          <div className="p-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        )}

        {!isLoading &&
          employees.length ===
            0 && (
            <div className="p-10 text-center">
              <p className="text-sm text-gray-500">
                No employees
                found
              </p>
            </div>
          )}

        {!isLoading &&
          employees.map(
            (emp: any) => {
              const active =
                selectedEmployee?.id ===
                emp.id;

              return (
                <button
                  key={emp.id}
                  onClick={() =>
                    onSelect(emp)
                  }
                  className={`w-full text-left p-4 transition ${
                    active
                      ? "bg-indigo-50 border-l-4 border-indigo-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        active
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <UserCog className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {
                          emp.full_name
                        }
                      </p>

                      <p className="text-sm text-gray-500 truncate">
                        {emp.email}
                      </p>

                      {emp.role_name && (
                        <p className="text-xs text-indigo-600 mt-1">
                          {
                            emp.role_name
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            }
          )}
      </div>

      {/* Pagination */}
      {!isLoading && (
        <div className="p-4 flex items-center justify-between border-t border-gray-100 bg-gray-50">
          <button
            disabled={
              currentPage ===
                1 ||
              isFetching
            }
            onClick={() =>
              setPage((p) =>
                Math.max(
                  1,
                  p - 1
                )
              )
            }
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="text-sm text-gray-600">
            Page{" "}
            <span className="font-semibold">
              {
                currentPage
              }
            </span>{" "}
            of{" "}
            <span className="font-semibold">
              {totalPages}
            </span>
          </div>

          <button
            disabled={
              currentPage >=
                totalPages ||
              isFetching
            }
            onClick={() =>
              setPage(
                (p) =>
                  p + 1
              )
            }
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}