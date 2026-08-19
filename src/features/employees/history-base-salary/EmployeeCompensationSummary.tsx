import React, { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { addMonths, format } from "date-fns";
import { useOrganization } from "../../../features/organizations/settings/preferences/hooks";
import { salaryApi } from "./api";
import { useAuth } from "../../auth/AuthProvider";

type Props = { employeeId: string; currency: string };

export default function EmployeeCompensationSummary({ employeeId, currency }: Props) {
  const { organization_id } = useAuth();
  const { data: org, isLoading: orgLoading } = useOrganization();

  // ✅ Build active compensation type list
  const compensationTypes = useMemo(() => {
    if (orgLoading || !org?.compensation_settings?.types) return [];
    return org.compensation_settings.types
      .filter((t: any) => !t.deleted)
      .map((t: any) => ({
        id: String(t.id),
        name: String(t.name),
        sumup: !!t.sumup,
        label:
          t.name
            ?.replace(/_/g, " ")
            ?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Unnamed",
      }));
  }, [org, orgLoading]);

  // ✅ Fetch all compensation records safely
  const salaryQueries = useQueries({
    queries:
      compensationTypes.map((t) => ({
        queryKey: ["salary_current", organization_id, employeeId, t.id],
        queryFn: () => salaryApi.current(organization_id!, employeeId, t.id),
        enabled: !!organization_id && !!employeeId && !!t.id,
      })) || [],
  });

  const loading = orgLoading || salaryQueries.some((q) => q.isLoading);
  const nextMonthLabel = format(addMonths(new Date(), 1), "MMMM yyyy");

  return (
    <div className="bg-white shadow rounded-xl p-4 sm:p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
          Finalized Compensation Summary
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">
          Effective as of {nextMonthLabel}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600">Loading summary...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-700">
                <th className="p-2 sm:p-3 border">Component</th>
                <th className="p-2 sm:p-3 border text-right">
                  Amount ({currency || "—"})
                </th>
                <th className="p-2 sm:p-3 border">Effective From</th>
                <th className="p-2 sm:p-3 border">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {compensationTypes.length > 0 ? (
                compensationTypes.map((t, i) => {
                  const q = salaryQueries[i];
                  const data = q?.data || null;
                  const isNotSet =
                    !data ||
                    data === null ||
                    data?.amount === undefined ||
                    data?.amount === null;

                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-2 sm:p-3 border text-gray-800">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{t.label}</span>
                          {t.sumup ? (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-[1px] rounded-full">
                              Sum-up
                            </span>
                          ) : (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-[1px] rounded-full">
                              Non-sum
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-2 sm:p-3 border text-right text-gray-800">
                        {isNotSet ? (
                          <span className="text-red-600 font-medium">Not Set</span>
                        ) : (
                          <>
                            {currency} {data.amount?.toLocaleString() ?? 0}
                          </>
                        )}
                      </td>

                      <td className="p-2 sm:p-3 border text-gray-700">
                        {isNotSet ? "-" : data.effective_from || "-"}
                      </td>

                      <td className="p-2 sm:p-3 border text-gray-700">
                        {isNotSet ? "-" : data.remarks || "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center p-4 text-gray-500 italic"
                  >
                    No compensation types configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
