// src/client-companies/ClientForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useClientCompany,
  useCreateClientCompany,
  useUpdateClientCompany,
} from './hooks';
import { useAuth } from "../auth/AuthProvider";
import { Building2, Loader2 } from 'lucide-react';
import {
  getEmailValidationMessage,
  getPhoneValidationMessage,
} from "../../utils/validators";

type ClientCompany = {
  id?: string;
  name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  billing_currency?: string | null;
  address?: string | null; 
  tax_identifier?: string | null; 
  notes?: string | null;
  organizations?: {
    id: string;
    name: string;
    country_code: string;
  } | null;
};


const CURRENCIES = [
  { code: 'AED', label: 'AED - UAE Dirham' },
  { code: 'INR', label: 'INR - Indian Rupee' },
];

export default function ClientForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { organization_country_code } = useAuth();

  const defaultCurrency = organization_country_code === "IN" ? "INR" : "AED";

  const { data: company, isLoading } = useClientCompany(id || '');
  const createMutation = useCreateClientCompany();
  const updateMutation = useUpdateClientCompany(id || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    trigger,
  } = useForm<ClientCompany>({
    mode: "onTouched",
    defaultValues: {
      name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      billing_currency: defaultCurrency,
      address:'',
      tax_identifier: '',
      notes: ''
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name || '',
        contact_name: company.contact_name ?? '',
        contact_email: company.contact_email ?? '',
        contact_phone: company.contact_phone ?? '',
        billing_currency: company.billing_currency ?? defaultCurrency,
        notes: company.notes ?? '',
        tax_identifier: company.tax_identifier,
        address: company.address ?? '',
      });
    }
  }, [company, reset, defaultCurrency]);

  const onSubmit = async (values: ClientCompany) => {
    // Trigger validation first
    const valid = await trigger(["contact_email", "contact_phone"]);
    if (!valid) return;

    if (isEdit) {
      updateMutation.mutate(values, {
        onSuccess: () => navigate('/clients'),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => navigate('/clients'),
      });
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-8 h-8 text-indigo-600" />
          {isEdit ? 'Edit Client Company' : 'Add New Client'}
        </h1>
        <p className="text-slate-600 mt-1">
          {isEdit ? 'Update client details and billing preferences' : 'Register a new client company'}
        </p>
      </div>

      {/* Loading */}
      {isEdit && isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {(!isEdit || !isLoading) && (
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company Name <span className="text-red-600">*</span>
              </label>
              <input
                {...register('name', { required: 'Company name is required' })}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="Acme Corp"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact Person
              </label>
              <input
                {...register('contact_name')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition"
                placeholder="John Doe"
              />
            </div>

            {/* Contact Email — WITH VALIDATION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                {...register('contact_email', {
                  validate: (value) => {
                    if (!value?.trim()) return true; // optional
                    const msg = getEmailValidationMessage(value);
                    return !msg || msg;
                  },
                })}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.contact_email ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="john@acme.com"
              />
              {errors.contact_email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.contact_email.message || "Invalid email address"}
                </p>
              )}
            </div>

{/* Contact Phone — WITH VALIDATION */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    Contact Phone
  </label>
  <input
    {...register("contact_phone", {
      validate: (value) => {
        if (!value?.trim()) return true; // optional

        // ✅ Use the client's organization country if editing, else fallback to user's org
        const clientCountryCode =
          company?.organizations?.country_code || organization_country_code;
        const code = clientCountryCode === "IN" ? "+91" : "+971";

        const msg = getPhoneValidationMessage(value, code);
        return !msg || msg;
      },
    })}
    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition ${
      errors.contact_phone
        ? "border-red-300 focus:border-red-500"
        : "border-gray-300"
    }`}
    placeholder={
      (company?.organizations?.country_code || organization_country_code) === "IN"
        ? "+91 98765 43210"
        : "+971 50 123 4567"
    }
  />
  {errors.contact_phone && (
    <p className="mt-1 text-xs text-red-600">
      {errors.contact_phone.message || "Invalid phone number"}
    </p>
  )}
</div>


            {/* Billing Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Billing Currency
              </label>
              <select
                {...register('billing_currency')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition bg-white"
                defaultValue={defaultCurrency}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700 mb-700 mb-1.5">
                Address (Optional)
              </label>
              <textarea
                {...register('address')}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition resize-none"
                placeholder="Client Address"
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700 mb-700 mb-1.5">
                TRN/GSTIN/UIN (Optional)
              </label> 
               <input
                {...register('tax_identifier')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition"
                placeholder=""
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-700 mb-1.5">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition resize-none"
                placeholder="Any additional information..."
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={busy}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                  busy
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                }`}
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{isEdit ? 'Update Client' : 'Create Client'}</>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="px-5 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}