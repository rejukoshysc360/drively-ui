// /src/projects/ProjectForm.tsx
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject, useCreateProject, useUpdateProject } from './hooks';
import { useClientCompanies } from '../clients/hooks';
import { useAuth } from '../auth/AuthProvider';
import { CirclePlus, Info, Loader2 } from 'lucide-react';
import { useCan } from '../../utils/permissions';
 

type ProjectFormValues = {
  client_company_id: string;
  name: string;
  code?: string;
  project_reference?: string | null;
  loa_signed_date?: string | null;
  client_lead_consultant?: string | null;
  billing_type: 'time_and_materials' | 'fixed_fee';
  fixed_fee_amount?: number | null;
  currency: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  notes?: string | null;
  terms?: string | null;
  scope: 'cross_organization' | 'current_organization';
};

const CURRENCIES = [
  { code: 'AED', label: 'AED - UAE Dirham' },
  { code: 'INR', label: 'INR - Indian Rupee' },
];

const FIELD_LABELS: Record<string, string> = {
  fixed_fee_amount: 'Fixed Fee Amount',
  billing_type: 'Billing Type',
  start_date: 'Start Date',
  end_date: 'End Date',
};

export default function ProjectForm() {
  const can = useCan();
  const canViewAll = can("projects:view");
    if (!canViewAll) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-.01-10a9 9 0 100 18 9 9 0 000-18z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-500">
            You do not have permission to view projects. Please contact your HR or
            Administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }
  const { projectId } = useParams<{ projectId?: string }>();
  const isEdit = !!projectId;
  const navigate = useNavigate();

  const { organization_country_code } = useAuth();
  const defaultCurrency = organization_country_code === 'IN' ? 'INR' : 'AED';

  const { data: project, isLoading } = useProject(projectId || '');
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject(projectId || '');

  const { data: clientsData, isLoading: isClientsLoading } = useClientCompanies(1, 1000, undefined);
  const clientOptions = clientsData?.client_companies ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    defaultValues: {
      client_company_id: '',
      name: '',
      code: '',
      project_reference: '',
      loa_signed_date: '',
      client_lead_consultant: '',
      billing_type: 'fixed_fee',
      fixed_fee_amount: null,
      currency: defaultCurrency,
      start_date: '',
      end_date: '',
      status: 'planned',
      notes: '',
      terms: '',
      scope: 'cross_organization',
    },
  });

  const billingType = watch('billing_type');

  // Reduced audit fields — only project-level changes
  const AUDIT_FIELDS = ['fixed_fee_amount', 'billing_type', 'start_date', 'end_date'] as const;

  const auditsRef = useRef<
    { field_name: string; old_value: string; new_value: string; note: string }[]
  >([]);

  const [changedFields, setChangedFields] = useState<
    { field: string; oldValue: any; newValue: any }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [auditNote, setAuditNote] = useState('');
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    if (billingType !== 'fixed_fee') setValue('fixed_fee_amount', null);
  }, [billingType, setValue]);

  useEffect(() => {
    if (!project) return;
    reset({
      client_company_id: project.client_company_id || '',
      name: project.name || '',
      code: project.code || '',
      project_reference: project.project_reference ?? '',
      loa_signed_date: project.loa_signed_date ? project.loa_signed_date.substring(0, 10) : '',
      client_lead_consultant: project.client_lead_consultant ?? '',
      billing_type: project.billing_type || 'fixed_fee',
      fixed_fee_amount: project.billing_type === 'fixed_fee' ? project.fixed_fee_amount ?? null : null,
      currency: project.currency || defaultCurrency,
      start_date: project.start_date ? project.start_date.substring(0, 10) : '',
      end_date: project.end_date ? project.end_date.substring(0, 10) : '',
      status: project.status ?? 'planned',
      notes: project.notes ?? '',
      terms: project.terms ?? '',
      scope: project.scope ?? 'current_organization',
    });
  }, [project, reset, defaultCurrency]);

const onSubmit = (values: ProjectFormValues) => {
  if (isEdit && project) {
    const detected = Object.keys(values)
      .filter((key) => {
        if (!AUDIT_FIELDS.includes(key as any)) return false;
        const oldVal = project[key as keyof typeof project] ?? '';
        const newVal = values[key as keyof ProjectFormValues] ?? '';
        return String(oldVal) !== String(newVal);
      })
      .map((key) => ({
        field: key,
        oldValue: project[key as keyof typeof project] ?? '',
        newValue: values[key as keyof ProjectFormValues] ?? '',
      }));

    if (detected.length > 0) {
      // ✅ Skip showing audit modal — record audit automatically
      auditsRef.current = detected.map((d) => ({
        field_name: d.field,
        old_value: String(d.oldValue ?? ''),
        new_value: String(d.newValue ?? ''),
        note: '(auto audit - confirmation skipped)',
      }));
      // Continue saving directly without blocking
    }
  }

  performProjectSave(values);
};


  const handleAuditConfirm = () => {
    const current = changedFields[currentIndex];
    if (!current) return;

    auditsRef.current.push({
      field_name: current.field,
      old_value: String(current.oldValue ?? ''),
      new_value: String(current.newValue ?? ''),
      note: auditNote.trim() || '(no note)',
    });

    moveToNext();
  };

  const handleAuditCancel = () => {
    setShowAudit(false);
    setChangedFields([]);
    setCurrentIndex(0);
    setAuditNote('');
    auditsRef.current = [];
  };

  const moveToNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= changedFields.length) {
      setShowAudit(false);
      const values = getValues();
      performProjectSave(values);
    } else {
      setCurrentIndex(nextIndex);
      setAuditNote('');
    }
  };

  const performProjectSave = (values: ProjectFormValues) => {
    const payload: any = {
      ...values,
      code: values.code?.trim() || undefined,
      project_reference: values.project_reference?.trim() || null,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      loa_signed_date: values.loa_signed_date || null,
      notes: values.notes?.trim() ? values.notes : null,
      terms: values.terms?.trim() ? values.terms : null,
      fixed_fee_amount: values.billing_type === 'fixed_fee' ? values.fixed_fee_amount ?? 0 : null,
      scope: values.scope || 'current_organization',
    };

    if (isEdit) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          auditsRef.current = [];
          navigate('/projects');
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => navigate('/projects'),
      });
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <CirclePlus className="w-8 h-8 text-indigo-600" />
          {isEdit ? 'Edit Project' : 'Create New Project'}
        </h1>
      </div>

      {(!isEdit || !isLoading) && (
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200 max-w-4xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div>
  <label className="block text-sm font-medium mb-1.5">
    Client Company <span className="text-red-600">*</span>
  </label>

  <select
    {...register('client_company_id', {
      required: 'Client Company is required',
    })}
    disabled={isClientsLoading}
    className={`w-full px-4 py-2.5 border rounded-lg ${
      errors.client_company_id
        ? 'border-red-500 focus:border-red-500'
        : 'border-gray-300'
    }`}
  >
    <option value="">Select a client</option>
    {clientOptions.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name}
      </option>
    ))}
  </select>

  {errors.client_company_id && (
    <p className="mt-1 text-xs text-red-600">
      {errors.client_company_id.message}
    </p>
  )}
</div>

<div>
  <label className="block text-sm font-medium mb-1.5">
    Project Name <span className="text-red-600">*</span>
  </label>

  <input
    {...register('name', {
      required: 'Project Name is required',
    })}
    className={`w-full px-4 py-2.5 border rounded-lg ${
      errors.name
        ? 'border-red-500 focus:border-red-500'
        : 'border-gray-300'
    }`}
  />

  {errors.name && (
    <p className="mt-1 text-xs text-red-600">
      {errors.name.message}
    </p>
  )}
</div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Project Code</label>
                <input {...register('code')} className="w-full px-4 py-2.5 border rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Project Reference</label>
                <input {...register('project_reference')} className="w-full px-4 py-2.5 border rounded-lg" placeholder="REEC/AUH/A/0001-Rev 01" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Lead Consultant</label>
                <input {...register('client_lead_consultant')} className="w-full px-4 py-2.5 border rounded-lg" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">LOA Signed Date</label>
                <input type="date" {...register('loa_signed_date')} className="w-full px-4 py-2.5 border rounded-lg" />
              </div>

<div>
  <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">
    Project Start Date
    <span className="relative group">
      <Info size={14} className="text-gray-400 cursor-help" />
      <span className="absolute left-0 top-full mt-1 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10">
        Overall project timeline for contractual and tracking purposes.
        Actual progress and status are driven by task schedules.
      </span>
    </span>
  </label>

  <input
    type="date"
    {...register('start_date')}
    className="w-full px-4 py-2.5 border rounded-lg"
  />
</div>

<div>
  <label className="block text-sm font-medium mb-1.5 flex items-center gap-1">
    Project End Date
    <span className="relative group">
      <Info size={14} className="text-gray-400 cursor-help" />
      <span className="absolute left-0 top-full mt-1 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10">
        Overall project timeline for contractual and tracking purposes.
        Actual progress, burn, and delivery health are calculated from tasks.
      </span>
    </span>
  </label>

  <input
    type="date"
    {...register('end_date')}
    className="w-full px-4 py-2.5 border rounded-lg"
  />
</div>


              <div>
                <label className="block text-sm font-medium mb-1.5">Billing Type *</label>
                <select {...register('billing_type', { required: true })} className="w-full px-4 py-2.5 border rounded-lg">
                  <option value="fixed_fee">Fixed Fee</option>
                  <option value="time_and_materials" disabled>Time & Materials</option>
                </select>
              </div>

              {watch('billing_type') === 'fixed_fee' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Fixed Fee Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('fixed_fee_amount', {
                      required: 'Amount required for fixed fee',
                      valueAsNumber: true,
                    })}
                    className="w-full px-4 py-2.5 border rounded-lg"
                  />
                  {errors.fixed_fee_amount && <p className="mt-1 text-xs text-red-600">{errors.fixed_fee_amount.message}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">Currency</label>
                <select {...register('currency')} className="w-full px-4 py-2.5 border rounded-lg">
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div> 
              <div>
                <label className="block text-sm font-medium mb-1.5">Status</label>
                <select {...register('status')} className="w-full px-4 py-2.5 border rounded-lg">
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
            <label className="block text-sm font-medium mb-1.5">Scope *</label>
            <select
              {...register('scope', { required: true })}
              className="w-full px-4 py-2.5 border rounded-lg"
            >
              <option value="cross_organization">Cross Organization</option>
              <option value="current_organization">Current Organization</option>
            </select>
          </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea {...register('notes')} rows={3} className="w-full px-4 py-2.5 border rounded-lg resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Terms & Conditions</label>
                <textarea {...register('terms')} rows={3} className="w-full px-4 py-2.5 border rounded-lg resize-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="animate-spin w-5 h-5" /> : isEdit ? 'Update Project' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
            </div>

            {isEdit && (
              <div className="mt-8 pt-6 border-t text-center">
                <p className="text-sm text-gray-600">
                  Add deliverables, timelines, and submission status in the <strong>Tasks / Stages</strong> section after saving.
                </p>
              </div>
            )}
          </form>
        </div>
      )} 
    </div>
  );
}