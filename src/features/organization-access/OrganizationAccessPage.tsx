import { useState } from "react";
import { Network } from "lucide-react";
import EmployeeListPanel from "./EmployeeListPanel";
import OrganizationAssignPanel from "./OrganizationAssignPanel";


export default function OrganizationAccessPage() {
  const [selectedEmployee, setSelectedEmployee] =
    useState<any>(null);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Network className="w-8 h-8 text-indigo-600" />

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Organization Access
            </h1>

            <p className="text-sm text-gray-500">
              Assign multiple organizations to managers,
              HRs, and admins
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <EmployeeListPanel
            selectedEmployee={selectedEmployee}
            onSelect={setSelectedEmployee}
          />
        </div>

        <div className="xl:col-span-2">
          <OrganizationAssignPanel
            employee={selectedEmployee}
          />
        </div>
      </div>
    </div>
  );
}