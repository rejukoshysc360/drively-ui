import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Loader2,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  useAssignUserOrganizations,
  useUserOrganizations,
} from "./hooks";
import { useOrganizations } from "../../features/organizations/hooks";
import { emitInfo } from "../../lib/info-bus";
 

type Props = {
  employee: any;
};

export default function OrganizationAssignPanel({
  employee,
}: Props) {
  const [selectedOrgIds, setSelectedOrgIds] =
    useState<string[]>([]);

  const {
    data: assignedData,
    isLoading: loadingAssignments,
  } = useUserOrganizations(employee?.id);

  // fetch orgs paginated
  const page = 1;
  const limit = 100;

  const {
    data: organizationsData,
    isLoading: loadingOrganizations,
  } = useOrganizations(page, limit);

  const assignMutation =
    useAssignUserOrganizations();

  const organizations =
    organizationsData?.organizations ?? [];

  // preload assigned orgs
useEffect(() => {
  if (Array.isArray(assignedData)) {
    setSelectedOrgIds(
      assignedData.map(
        (o: any) => o.organization_id
      )
    );
  }
}, [assignedData]);

  const toggleOrganization = (
    organizationId: string
  ) => {
    setSelectedOrgIds((prev) => {
      if (prev.includes(organizationId)) {
        return prev.filter(
          (id) => id !== organizationId
        );
      }

      return [...prev, organizationId];
    });
  };

  const selectedCount =
    selectedOrgIds.length;

  const handleSave = async () => {
    if (!employee) return;

    try {
      await assignMutation.mutateAsync({
        employeeId: employee.id,
        organizationIds: selectedOrgIds,
      }); 
      // ✅ Centralized success notification
      emitInfo(
        "Organization assignments updated successfully"
      );
    } catch (err: any) {
      toast.error(
        err?.message ||
          "Failed to update organizations"
      );
    }
  };

  const isLoading =
    loadingAssignments || loadingOrganizations;

  if (!employee) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-14 h-14 mx-auto text-gray-300 mb-4" />

          <h3 className="text-lg font-semibold text-gray-700">
            Select an Employee
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Choose a manager, HR, or admin
            from the left panel
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[500px]">
      {/* HEADER */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {employee.full_name}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {employee.email}
            </p>

            <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
              {employee.role_name || "Employee"}
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">
              Assigned Organizations
            </p>

            <p className="text-2xl font-bold text-indigo-600">
              {selectedCount}
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6">
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        )}

        {!isLoading && (
          <>
            {organizations.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />

                <p className="text-gray-500">
                  No organizations found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organizations.map((org: any) => {
                  const selected =
                    selectedOrgIds.includes(org.id);

                  return (
                    <button
                      key={org.id}
                      onClick={() =>
                        toggleOrganization(org.id)
                      }
                      className={`relative border rounded-2xl p-5 text-left transition-all ${
                        selected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                      }`}
                    >
                      {/* check icon */}
                      {selected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            selected
                              ? "bg-indigo-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Building2
                            className={`w-6 h-6 ${
                              selected
                                ? "text-indigo-600"
                                : "text-gray-500"
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {org.name}
                          </p>

                          {org.country_code && (
                            <p className="text-sm text-gray-500 mt-1">
                              {org.country_code}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER */}
      {!isLoading && organizations.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={assignMutation.isPending}
            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium transition ${
              assignMutation.isPending
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Assignments
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}