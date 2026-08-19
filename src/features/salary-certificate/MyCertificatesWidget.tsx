import {
  ExternalLink,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useCan } from "../../utils/permissions";
import {
  useSalaryCertificates,
} from "./hooks";
import {
  useJoiningCertificates,
} from "../joiningCertificates/hooks";
import { useMemo } from "react";

interface Props {
  limit?: number;
  showHeader?: boolean;
}

export default function MyCertificatesWidget({
  limit = 5,
  showHeader = true,
}: Props) {
  const { profile } = useAuth();
  const can = useCan();
  const navigate = useNavigate();

  const canView = can("employees:view_own_record_only");
  const employeeId = profile?.id;

  const { data: salaryData, isLoading: salaryLoading } =
    useSalaryCertificates({
      page: 1,
      limit: 50,
      employee_id: employeeId,
    });

  const { data: joiningData, isLoading: joiningLoading } =
    useJoiningCertificates({
      page: 1,
      limit: 50,
      employee_id: employeeId,
    });

  const certificates = useMemo(() => {
    const salary =
      salaryData?.certificates?.map((c: any) => ({
        ...c,
        type: "salary",
      })) ?? [];

    const joining =
      joiningData?.certificates?.map((c: any) => ({
        ...c,
        type: "joining",
      })) ?? [];

    return [...salary, ...joining]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
  }, [salaryData, joiningData]);

  const visible = certificates.slice(0, limit);

  const isLoading = salaryLoading || joiningLoading;

  if (!canView) {
    return null;
  }

  const getStatusBadge = (status?: string) => {
    return status === "released" ? (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
        Released
      </span>
    ) : (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
        Requested
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">

      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-600" />

            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
              My Certificates
            </h2>

            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
              {certificates.length}
            </span>
          </div>

          <button
            onClick={() => navigate("/certificates")}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
          >
            {/* View All <ExternalLink className="w-3 h-3" /> */}
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="text-sm text-gray-500 py-4 text-center">
          Loading certificates…
        </div>
      ) : visible.length > 0 ? (
        <div className="space-y-3">

          {visible.map((c: any) => (
            <div
              key={`${c.type}-${c.id}`}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between gap-3">

                {/* LEFT */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {c.type === "salary"
                      ? "Salary Certificate"
                      : "Joining Certificate"}
                  </p>

                  {c.type === "salary" && (
                    <p className="text-xs text-gray-600 mt-1">
                      Purpose: {c.certificate_json?.purpose ?? "—"}
                    </p>
                  )}

                  <p className="text-[11px] text-gray-500 mt-1">
                    {new Date(c.created_at).toLocaleDateString("en-GB")}
                  </p>

                  <div className="mt-2">
                    {getStatusBadge(c.status)}
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-end gap-2">
                  {c.status !== "released" && (
                    <span className="text-[11px] text-gray-400 italic">
                      Awaiting HR
                    </span>
                  )}
                </div>

              </div>
            </div>
          ))}

        </div>
      ) : (
        <div className="text-sm text-gray-500 py-4 text-center">
          No certificates found.
        </div>
      )}
    </div>
  );
}