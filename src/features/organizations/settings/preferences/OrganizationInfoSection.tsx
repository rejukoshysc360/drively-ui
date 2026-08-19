import { useEffect, useState } from "react";
import {
  Building2,
  Save,
  Upload,
} from "lucide-react";
import { toast } from "react-hot-toast";

import {
  useOrganization,
  useOrganizationPhotoUrl,
  useUpdateOrganizationSettings,
  useUploadOrganizationPhoto,
} from "./hooks";

import { useCan } from "../../../../utils/permissions";
import { useAuth } from "../../../../features/auth/AuthProvider";

export default function OrganizationInfoSection() {
  const { data, isLoading } = useOrganization();

  const updateSettings = useUpdateOrganizationSettings();

  const uploadPhoto = useUploadOrganizationPhoto();
  const photoDownload = useOrganizationPhotoUrl();

  const { profile, setOrganizationLogo } = useAuth();

  const can = useCan();

  /*
   * -------------------------------------------------------
   * Role Detection
   * -------------------------------------------------------
   */

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
      ? [profile.roles]
      : [];

  const roleSlugs = roles
    .map((role: any) => role?.slug)
    .filter(Boolean);

  const isAdmin = roleSlugs.includes("admin");
  const isSuperAdmin = roleSlugs.includes("superadmin");

  /*
   * During MVP Admin has full access.
   * Permission restrictions can be tightened later.
   */

  const canView =
    isAdmin ||
    isSuperAdmin ||
    can("organization:view");

  const canUpdate =
    isAdmin ||
    isSuperAdmin ||
    can("organization:update");

  /*
   * -------------------------------------------------------
   * Organization Fields
   * -------------------------------------------------------
   */

  const [orgName, setOrgName] = useState("");
  const [address, setAddress] = useState("");

  const [email, setEmail] = useState("");
  const [accountantEmail, setAccountantEmail] = useState("");

  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  const [taxIdentifier, setTaxIdentifier] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const [countryCode, setCountryCode] = useState("");
  const [currency, setCurrency] = useState("");

  /*
   * Workshop-specific fields.
   *
   * These require corresponding columns in the organizations
   * table/backend before they are included in handleSave().
   */

  const [workshopCode, setWorkshopCode] = useState("");
  const [workshopPhone, setWorkshopPhone] = useState("");

  /*
   * -------------------------------------------------------
   * Organization Logo
   * -------------------------------------------------------
   */

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /*
   * -------------------------------------------------------
   * Populate Organization Data
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!data) return;

    setOrgName(data.name || "");
    setAddress(data.address || "");

    setEmail(data.email || "");
    setAccountantEmail(data.accountant_email || "");

    setPhone(data.phone || "");
    setWebsite(data.website || "");

    setTaxIdentifier(data.tax_identifier || "");
    setBankAccount(data.bank_account || "");

    const country = data.country_code || "";

    setCountryCode(country);

    setCurrency(
      data.currency ||
        (country === "AE"
          ? "AED"
          : country === "IN"
            ? "INR"
            : ""),
    );

    /*
     * These are safe even if the API currently does not
     * return the fields.
     */

    setWorkshopCode(data.workshop_code || "");
    setWorkshopPhone(data.workshop_phone || "");
  }, [data]);

  /*
   * -------------------------------------------------------
   * Load Organization Logo
   * -------------------------------------------------------
   */

  useEffect(() => {
    photoDownload.mutate(undefined, {
      onSuccess: (res: any) => {
        if (!res?.url) {
          setPhotoUrl(null);
          return;
        }

        setPhotoUrl(res.url);
        setOrganizationLogo(res.url);
      },

      onError: () => {
        setPhotoUrl(null);
      },
    });
  }, []);

  /*
   * -------------------------------------------------------
   * Logo Upload
   * -------------------------------------------------------
   */

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = e.target;

    if (!input.files?.length) return;

    const file = input.files[0];

    input.value = "";

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Maximum file size is 2MB.");
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      setPhotoUrl(objectUrl);

      uploadPhoto.mutate(
        {
          file,
          onProgress: setProgress,
        },
        {
          onSuccess: () => {
            setProgress(0);

            URL.revokeObjectURL(objectUrl);

            photoDownload.mutate(undefined, {
              onSuccess: (res: any) => {
                if (!res?.url) return;

                setPhotoUrl(res.url);
                setOrganizationLogo(res.url);
              },
            });

            toast.success("Organization logo updated.");
          },

          onError: (err: any) => {
            setProgress(0);

            URL.revokeObjectURL(objectUrl);

            toast.error(
              err?.response?.data?.message ||
                "Logo upload failed.",
            );
          },
        },
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      toast.error("Invalid image file.");
    };

    image.src = objectUrl;
  };

  /*
   * -------------------------------------------------------
   * Country / Currency
   * -------------------------------------------------------
   */

  const handleCountryChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const country = e.target.value;

    setCountryCode(country);

    if (country === "AE") {
      setCurrency("AED");
      return;
    }

    if (country === "IN") {
      setCurrency("INR");
      return;
    }

    setCurrency("");
  };

  /*
   * -------------------------------------------------------
   * Save
   * -------------------------------------------------------
   */

  const handleSave = async () => {
    if (!orgName.trim()) {
      toast.error("Organization name is required.");
      return;
    }

    if (!countryCode) {
      toast.error("Country is required.");
      return;
    }

    try {
      await updateSettings.mutateAsync({
        name: orgName.trim(),

        address: address.trim() || null,

        email: email.trim() || null,

        accountant_email:
          accountantEmail.trim() || null,

        phone: phone.trim() || null,

        website: website.trim() || null,

        tax_identifier:
          taxIdentifier.trim() || null,

        bank_account:
          bankAccount.trim() || null,

        country_code: countryCode,

        currency,

        /*
         * Add these after workshop_code and workshop_phone
         * are added to the organizations table/backend:
         *
         * workshop_code: workshopCode.trim() || null,
         * workshop_phone: workshopPhone.trim() || null,
         */
      });

      toast.success("Organization information updated.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update organization.",
      );
    }
  };

  /*
   * -------------------------------------------------------
   * Access
   * -------------------------------------------------------
   */

  if (!canView) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="text-base">
          You don&apos;t have permission to view organization
          information.
        </p>
      </div>
    );
  }

  /*
   * -------------------------------------------------------
   * Loading
   * -------------------------------------------------------
   */

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">
          Loading organization information...
        </p>
      </div>
    );
  }

  /*
   * -------------------------------------------------------
   * Shared Input Styling
   * -------------------------------------------------------
   */

  const inputClass = `
    w-full
    px-4
    py-3
    text-base
    border
    rounded-xl
    outline-none
    transition
    ${
      canUpdate
        ? "border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        : "border-gray-200 bg-gray-50 cursor-not-allowed"
    }
  `;

  /*
   * -------------------------------------------------------
   * Render
   * -------------------------------------------------------
   */

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">

        {/* Header */}

        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Organization Information
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Configure workshop identity, contact and billing
            information.
          </p>
        </div>

        <div className="p-6 space-y-8">

          {/* Organization Logo */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Workshop Logo
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">

              <div className="relative group shrink-0">
                <input
                  id="org-photo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={!canUpdate}
                />

                <div className="relative h-28 w-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shadow-sm">

                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Workshop Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-gray-400" />
                  )}

                  {canUpdate && (
                    <label
                      htmlFor="org-photo-upload"
                      className="
                        absolute
                        inset-0
                        bg-black/40
                        opacity-0
                        group-hover:opacity-100
                        flex
                        items-center
                        justify-center
                        cursor-pointer
                        transition
                      "
                    >
                      <Upload className="text-white w-6 h-6" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Upload your workshop logo. It can be used in
                  quotations, invoices and customer documents.
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG or WebP. Maximum file size 2MB.
                </p>

                {progress > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Uploading</span>
                      <span>{progress}%</span>
                    </div>

                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-indigo-500 transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Basic Information */}

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-5">
              Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization / Workshop Name
                </label>

                <input
                  type="text"
                  value={orgName}
                  onChange={(e) =>
                    setOrgName(e.target.value)
                  }
                  disabled={!canUpdate}
                  className={inputClass}
                  placeholder="Enter workshop name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workshop Code
                </label>

                <input
                  type="text"
                  value={workshopCode}
                  onChange={(e) =>
                    setWorkshopCode(e.target.value)
                  }
                  disabled={!canUpdate}
                  className={inputClass}
                  placeholder="e.g. DRV-KOC-001"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Optional internal workshop identifier.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>

                <select
                  value={countryCode}
                  disabled={!canUpdate}
                  onChange={handleCountryChange}
                  className={inputClass}
                >
                  <option value="">
                    Select Country
                  </option>

                  <option value="IN">
                    India
                  </option>

                  <option value="AE">
                    United Arab Emirates
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>

                <input
                  type="text"
                  value={currency}
                  readOnly
                  className="
                    w-full
                    px-4
                    py-3
                    text-base
                    bg-gray-50
                    border
                    border-gray-200
                    rounded-xl
                    text-gray-600
                  "
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>

                <textarea
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  rows={4}
                  disabled={!canUpdate}
                  className={`${inputClass} resize-none`}
                  placeholder="Enter full workshop address"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Contact Information */}

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-5">
              Contact Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={!canUpdate}
                  className={inputClass}
                  placeholder="info@workshop.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  disabled={!canUpdate}
                  className={inputClass}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workshop Phone
                </label>

                <input
                  type="tel"
                  value={workshopPhone}
                  onChange={(e) =>
                    setWorkshopPhone(e.target.value)
                  }
                  disabled={!canUpdate}
                  className={inputClass}
                  placeholder="+91 484 000 0000"
                />

                <p className="text-xs text-gray-400 mt-1">
                  Number customers can use for service and
                  appointment enquiries.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>

                <input
                  type="url"
                  value={website}
                  onChange={(e) =>
                    setWebsite(e.target.value)
                  }
                  disabled={!canUpdate}
                  className={inputClass}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Billing Information */}

          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-5">
              Billing & Tax Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing / Accountant Email
                </label>

                <input
                  type="email"
                  value={accountantEmail}
                  onChange={(e) =>
                    setAccountantEmail(e.target.value)
                  }
                  disabled={!canUpdate}
                  className={inputClass}
                  placeholder="accounts@workshop.com"
                />

                <p className="text-xs text-gray-500 mt-2">
                  Used for billing and invoice-related
                  communication.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Identifier
                </label>

                <input
                  type="text"
                  value={taxIdentifier}
                  onChange={(e) =>
                    setTaxIdentifier(e.target.value)
                  }
                  disabled={!canUpdate}
                  className={inputClass}
                  placeholder={
                    countryCode === "IN"
                      ? "GSTIN"
                      : countryCode === "AE"
                        ? "TRN"
                        : "Tax Identifier"
                  }
                />

                <p className="text-xs text-gray-500 mt-2">
                  GSTIN, TRN or applicable business tax
                  registration number.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account Details
                </label>

                <textarea
                  value={bankAccount}
                  onChange={(e) =>
                    setBankAccount(e.target.value)
                  }
                  rows={4}
                  disabled={!canUpdate}
                  className={`${inputClass} resize-none`}
                  placeholder="Enter bank account details"
                />

                <p className="text-xs text-gray-500 mt-2">
                  These details may be displayed on quotations
                  and invoices.
                </p>
              </div>
            </div>
          </div>

          {/* Save */}

          {canUpdate && (
            <div className="pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="
                  w-full
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-5
                  py-3
                  bg-indigo-600
                  text-white
                  font-medium
                  rounded-xl
                  hover:bg-indigo-700
                  disabled:opacity-70
                  disabled:cursor-not-allowed
                  transition
                  shadow-sm
                  text-sm
                "
              >
                <Save className="w-4 h-4" />

                {updateSettings.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}