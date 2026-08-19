import React from "react";
import { User, Info } from "lucide-react";
import EmployeeDetail from "./EmployeeDetail";
 

export default function MyProfilePage() { 
  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* 🔹 Header - styled like EmployeeSelfDocuments */}
      <div className="mb-8 text-left lg:text-left">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <User className="w-8 h-8 text-indigo-600" />
          My Profile
        </h1>
        <p className="text-slate-600 mt-1 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-indigo-500" />
          Manage your personal and professional details securely
        </p>
      </div>

      {/* 🔹 Profile Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <EmployeeDetail />
      </div>
    </div>
  );
}
