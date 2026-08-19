import { useEffect, useState } from "react";
import { useClientCompanies } from "../clients/hooks";
import { useEmployees } from "../employees/hooks";
import { useProjects } from "../projects/hooks";
import {
  useAssignProjectEmployees,
  useProjectEmployees,
} from "./hooks";

import { Loader2, Users, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { APP_CONFIG } from "../../config/appConfig";

type Employee = {
  id: string;
  full_name: string;
  email: string;
};

type SelectedEmployee = {
  employee_id: string;
  billing_rate: number;
};

export default function ProjectEmployeeAssignment() {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [selectedEmployees, setSelectedEmployees] = useState<
    SelectedEmployee[]
  >([]);

  // ✅ PAGINATION
  const [page, setPage] = useState(1);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  // =========================
  // DATA
  // =========================
  const { data: clientData } = useClientCompanies(1, 100);

  // ✅ ALWAYS CALL HOOK NORMALLY (NO page=0 BUG)
  const {
    data: empData,
    isFetching: empFetching,
  } = useEmployees(page, APP_CONFIG.PAGE_SIZE);

  const { data: projectData, isLoading: projectLoading } =
    useProjects(1, 100);

  const { data: assignedData, isLoading: assignedLoading } =
    useProjectEmployees(selectedProjectId);

  const assignMutation =
    useAssignProjectEmployees(selectedProjectId);

  const clients = clientData?.client_companies ?? [];
  const projects = projectData?.projects ?? [];

  // =========================
  // FILTER PROJECTS
  // =========================
  const filteredProjects = selectedClientId
    ? projects.filter(
        (p: any) => p.client_company_id === selectedClientId
      )
    : [];

  // =========================
  // RESET ON PROJECT CHANGE
  // =========================
  useEffect(() => {
    if (!selectedProjectId) return;

    setPage(1);
    setAllEmployees([]);
  }, [selectedProjectId]);

  // =========================
  // APPEND EMPLOYEES
  // =========================
  useEffect(() => {
    if (!selectedProjectId) return; // 🔥 IMPORTANT

    if (empData?.employees) {
      setAllEmployees((prev) => {
        const newOnes = empData.employees.filter(
          (e: Employee) => !prev.some((p) => p.id === e.id)
        );
        return [...prev, ...newOnes];
      });
    }
  }, [empData, selectedProjectId]);

  const employees: Employee[] = allEmployees;

  // =========================
  // PREFILL ASSIGNED
  // =========================
  useEffect(() => {
    if (!selectedProjectId) return;

    const list = assignedData?.employees || [];

    setSelectedEmployees(
      list.map((e: any) => ({
        employee_id: e.employee_id,
        billing_rate: Number(e.billing_rate || 0),
      }))
    );
  }, [assignedData, selectedProjectId]);

  // =========================
  // HELPERS
  // =========================
  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) => {
      const exists = prev.find((e) => e.employee_id === id);

      if (exists) {
        return prev.filter((e) => e.employee_id !== id);
      }

      return [...prev, { employee_id: id, billing_rate: 0 }];
    });
  };

  const updateRate = (id: string, rate: number) => {
    setSelectedEmployees((prev) =>
      prev.map((e) =>
        e.employee_id === id ? { ...e, billing_rate: rate } : e
      )
    );
  };

  const selectAll = () =>
    setSelectedEmployees(
      employees.map((e) => ({
        employee_id: e.id,
        billing_rate: 0,
      }))
    );

  const clearAll = () => setSelectedEmployees([]);

  const isSelected = (id: string) =>
    selectedEmployees.some((e) => e.employee_id === id);

  const getRate = (id: string) =>
    selectedEmployees.find((e) => e.employee_id === id)
      ?.billing_rate || 0;

  // =========================
  // SAVE
  // =========================
  const handleAssign = () => {
    if (!selectedProjectId) {
      toast.error("Select project");
      return;
    }

    assignMutation.mutate(
      { employees: selectedEmployees },
      {
        onSuccess: () =>
          toast.success("Project assignment saved"),
        onError: () =>
          toast.error("Failed to assign"),
      }
    );
  };

  // =========================
  // LOAD MORE LOGIC
  // =========================
  const hasMore =
    empData?.paginationMetaInfo?.totalPages
      ? page < empData.paginationMetaInfo.totalPages
      : (empData?.employees?.length || 0) === APP_CONFIG.PAGE_SIZE;

  // =========================
  // UI
  // =========================
  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" />
          Project Employee Assignment
        </h1>
        <p className="text-sm text-gray-500">
          Assign employees to projects
        </p>
      </div>

      {/* FILTER */}
      <div className="bg-white rounded-xl p-4 border shadow-sm grid sm:grid-cols-2 gap-4">

        <select
          className="input"
          value={selectedClientId}
          onChange={(e) => {
            setSelectedClientId(e.target.value);
            setSelectedProjectId("");
            setSelectedEmployees([]);
            setAllEmployees([]);
          }}
        >
          <option value="">Select client</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={selectedProjectId}
          disabled={!selectedClientId || projectLoading}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">
            {!selectedClientId
              ? "Select client first"
              : projectLoading
              ? "Loading..."
              : "Select project"}
          </option>

          {filteredProjects.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* ========================= */}
      {/* EMPLOYEES */}
      {/* ========================= */}
      {selectedProjectId && (
        <>
          {/* ACTION BAR */}
          <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3 sm:flex sm:justify-between sm:items-center">

            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg"
              >
                Select Visible
              </button>

              <button
                onClick={clearAll}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg"
              >
                Clear
              </button>
            </div>

            <button
              onClick={handleAssign}
              disabled={assignMutation.isPending}
              className="w-full sm:w-auto px-5 py-2 bg-indigo-600 text-white rounded-lg flex items-center justify-center gap-2"
            >
              {assignMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Assignment
            </button>
          </div>

          {/* GRID */}
          {employees.length === 0 && empFetching ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => {
                const selected = isSelected(emp.id);

                return (
                  <div
                    key={emp.id}
                    className={`border rounded-xl p-4 ${
                      selected
                        ? "border-indigo-600 bg-indigo-100"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div
                      onClick={() => toggleEmployee(emp.id)}
                      className="flex justify-between cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">{emp.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {emp.email}
                        </p>
                      </div>

                      {selected && (
                        <Check className="text-indigo-600" />
                      )}
                    </div>

                    {selected && (
                      <input
                        type="number"
                        className="input mt-3 text-sm"
                        value={getRate(emp.id)}
                        onChange={(e) =>
                          updateRate(
                            emp.id,
                            Number(e.target.value)
                          )
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* LOAD MORE */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={empFetching}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"
              >
                {empFetching ? (
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
        </>
      )}
    </div>
  );
}