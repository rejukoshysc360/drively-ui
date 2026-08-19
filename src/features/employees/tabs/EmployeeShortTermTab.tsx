import { useParams } from "react-router-dom";

export default function EmployeeShortTermTab() {
  const { employeeId } = useParams<{ employeeId: string }>();

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg sm:text-xl">Short Term Assignment</h2>

      <p className="text-sm sm:text-base text-gray-700">
        Temporary transfers or postings for employee{" "}
        <span className="font-mono text-gray-900"></span>.
      </p> 
      <div className="card p-4 bg-white shadow rounded">
          - Next Phase - 
      </div>
    </div>
  );
}
