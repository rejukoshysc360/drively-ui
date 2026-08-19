import { useEffect, useRef, useState } from "react";
import FormDialog from "../../components/ui/FormDialog";
import { useEmployeePhotoUrl } from "../../features/employees/hooks";

export default function DirectoryDialog({
  open,
  employee,
  onClose,
}: {
  open: boolean;
  employee: any;
  onClose: () => void;
}) {
  if (!employee) return null;

  const {
    id,
    photo_url,
    full_name,
    email,
    phone,
    hire_date,
    department_name,
    designation_title,
    organization_name,
    address,
  } = employee;

  // 🧠 Pre-signed photo URL logic (same as EmployeeGeneralTab)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const photoDownload = useEmployeePhotoUrl(id);
  const hasFetchedPhoto = useRef(false);

  useEffect(() => {
    if (!id) return;
    if (hasFetchedPhoto.current) return;
    hasFetchedPhoto.current = true;

    console.log("📸 [DirectoryDialog] Fetching signed photo URL for:", id);

    photoDownload.mutate(undefined, {
      onSuccess: (res) => {
        console.log("✅ [DirectoryDialog] Signed URL response:", res);
        if (res?.url) {
          setPhotoUrl(res.url);
        } else {
          console.warn("⚠️ [DirectoryDialog] No signed URL returned, using employee.photo_url instead");
          setPhotoUrl(photo_url ?? null);
        }
      },
      onError: (err) => {
        console.error("❌ [DirectoryDialog] Failed to get signed photo URL:", err);
        setPhotoUrl(photo_url ?? null); // fallback to public URL
      },
    });
  }, [id, photo_url]);

  return (
    <FormDialog open={open} title="Employee Details" onClose={onClose}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-md border border-gray-200 flex items-center justify-center">
            {photoUrl || photo_url ? (
              <img
                src={photoUrl || photo_url || "/placeholder-avatar.png"}
                alt="Photo"
                className="object-contain w-full h-full rounded-full bg-white p-[2px] transition-transform duration-300 hover:scale-[1.02]" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                No Photo
              </div>
            )}
            <div className="absolute inset-0 rounded-full ring-2 ring-indigo-200 pointer-events-none"></div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-900">{full_name}</h3>
            <p className="text-sm text-gray-500">{designation_title || "—"}</p>
            <p className="text-sm text-gray-500">{department_name || "—"}</p>
            <p className="text-sm text-gray-500">{organization_name || "—"}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500 uppercase">Email</p>
            <p className="text-sm font-medium">{email || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Phone</p>
            <p className="text-sm font-medium">{phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Hire Date</p>
            <p className="text-sm font-medium">
              {hire_date ? new Date(hire_date).toLocaleDateString() : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Address</p>
            <p className="text-sm font-medium">{address || "—"}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </FormDialog>
  );
}
