import { useState } from "react";
import { FileText } from "lucide-react";
import SalaryCertificateRequestForm from "./SalaryCertificateRequestForm";
import EmployeeSalaryCertificates from "./SalaryCertificatesSelf";
import { useCan } from "../../utils/permissions";

export default function EmployeeSalaryCertificateSection() {
  const [activeTab, setActiveTab] = useState<"request" | "mycerts">("request");
  const can = useCan();

  //const canRequest = can("salary_certificate:create_own_record_only");
  const canRequest = true;
  const canView = true;
// const canView = can("payslip:view_own_record_only");

  if (!canRequest && !canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gray-50 text-center rounded-md border border-gray-200 p-10">
        <FileText className="w-14 h-14 text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Access Restricted</h2>
        <p className="text-gray-500 text-sm">
          You don’t have permission to manage salary certificates.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-md shadow-sm space-y-4">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
          My Salary Certificates
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">
          Request and download your salary certificates
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {canRequest && (
          <button
            onClick={() => setActiveTab("request")}
            className={`px-4 py-3 text-sm font-medium min-w-fit flex-shrink-0 ${
              activeTab === "request"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Request Certificate
          </button>
        )}
        {canView && (
          <button
            onClick={() => setActiveTab("mycerts")}
            className={`px-4 py-3 text-sm font-medium min-w-fit flex-shrink-0 ${
              activeTab === "mycerts"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            My Certificates
          </button>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "request" && canRequest && <SalaryCertificateRequestForm />}
        {activeTab === "mycerts" && canView && <EmployeeSalaryCertificates />}
      </div>
    </div>
  );
}
