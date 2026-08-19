// src/payroll/salary-categories/SalaryCategoryForm.tsx
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useCategories,
} from './hooks';
import { Settings, Loader2, ArrowUp, ArrowDown } from 'lucide-react';

type CategoryFormValues = {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  polarity: number; // 1 = Earning, -1 = Deduction
};

export default function SalaryCategoryForm() {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const isEdit = !!categoryId;
  const navigate = useNavigate();

  const { data: category, isLoading } = useCategory(categoryId || '');

  // 👉 Fetch ALL categories so we can block duplicate polarity
  const { data: allCats } = useCategories(1, 9999, '');

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(categoryId || '');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      display_order: 0,
      is_active: true,
      polarity: 1,
    },
  });

  // Determine polarity availability
  const polarityStatus = useMemo(() => {
    const items = allCats?.categories || [];
    return {
      earningExists: items.some((c: any) => c.polarity === 1),
      deductionExists: items.some((c: any) => c.polarity === -1),
    };
  }, [allCats]);

  // When editing, reset form
  useEffect(() => {
    if (category) {
      reset({
        code: category.code || '',
        name: category.name || '',
        description: category.description ?? '',
        display_order:
          typeof category.display_order === 'number'
            ? category.display_order
            : 0,
        is_active: Boolean(category.is_active),
        polarity: category.polarity === -1 ? -1 : 1,
      });
    }
  }, [category, reset]);

  const onSubmit = (values: CategoryFormValues) => {
    // Prevent duplicate polarity
    if (!isEdit) {
      if (values.polarity === 1 && polarityStatus.earningExists) {
        setError('polarity', {
          message: 'An Earning category already exists.',
        });
        return;
      }
      if (values.polarity === -1 && polarityStatus.deductionExists) {
        setError('polarity', {
          message: 'A Deduction category already exists.',
        });
        return;
      }
    }

    const payloadBase = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      display_order: Number(values.display_order) || 0,
      is_active: !!values.is_active,
      polarity: values.polarity,
    };

    if (isEdit) {
      updateMutation.mutate(payloadBase, {
        onSuccess: () => navigate('/payroll/salary-categories'),
      });
    } else {
      const createPayload = {
        ...payloadBase,
        code: values.code.trim().toUpperCase(),
      };
      createMutation.mutate(createPayload, {
        onSuccess: () => navigate('/payroll/salary-categories'),
      });
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  const currentPolarity = watch('polarity');

  // For create mode, disable selection if already exists
  const earningDisabled = !isEdit && polarityStatus.earningExists;
  const deductionDisabled = !isEdit && polarityStatus.deductionExists;

  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
     {/* Header — Mobile: tight & clean | Desktop: your original perfect look */}
<div className="mb-6 lg:mb-8">
  <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-2.5 lg:gap-3">
    <Settings className="w-7 h-7 lg:w-8 lg:h-8 text-indigo-600" />
    {isEdit ? 'Edit Salary Category' : 'Create Salary Category'}
  </h1>
  <p className="text-sm lg:text-base text-slate-600 mt-1.5">
    {isEdit ? 'Update category details and behavior' : 'Define a new payslip category'}
  </p>
</div>

      {/* Loading Skeleton */}
      {isEdit && isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 animate-pulse max-w-2xl mx-auto">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      )}

      {/* Form Card */}
      {(!isEdit || !isLoading) && (
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Code {!isEdit && <span className="text-red-600">*</span>}
              </label>
              <input
                {...register('code', {
                  required: !isEdit ? 'Code is required' : false,
                  pattern: !isEdit
                    ? {
                        value: /^[A-Z0-9_]+$/,
                        message: 'Only uppercase letters, numbers, and underscores',
                      }
                    : undefined,
                  setValueAs: (v) =>
                    typeof v === 'string' ? v.trim().toUpperCase() : v,
                })}
                disabled={isEdit}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition ${
                  isEdit
                    ? 'bg-gray-50 text-gray-600 cursor-not-allowed'
                    : errors.code
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="EARNING"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
              )}
              {isEdit && (
                <p className="mt-1 text-xs text-indigo-600">
                  Code cannot be changed after creation
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                {...register('name', {
                  required: 'Name is required',
                  setValueAs: (v) => (typeof v === 'string' ? v.trim() : v),
                })}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="Basic Salary"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Display Order
              </label>
              <input
                disabled
                type="number"
                min="0"
                step="1"
                {...register('display_order', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Must be 0 or higher' },
                })}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition ${
                  errors.display_order
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="10"
              />
              {errors.display_order && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.display_order.message}
                </p>
              )}
            </div>

            {/* Polarity with restriction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Polarity <span className="text-red-600">*</span>
              </label>

              <select
                {...register('polarity', {
                  valueAsNumber: true,
                  required: 'Please select polarity',
                })}
                disabled={isEdit}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition bg-white"
              >
                <option value={1} disabled={earningDisabled}>
                  Earning / Contribute {earningDisabled ? ' (Already Exists)' : ''}
                </option>
                <option value={-1} disabled={deductionDisabled}>
                  Deduction {deductionDisabled ? ' (Already Exists)' : ''}
                </option>
              </select>

              {errors.polarity && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.polarity.message}
                </p>
              )}
            </div>

            {/* Active */}
            <div className="flex items-center gap-3">
              <input
                disabled
                id="is_active"
                type="checkbox"
                {...register('is_active')}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                {...register('description', {
                  setValueAs: (v) => (typeof v === 'string' ? v.trim() : v),
                })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition resize-none"
                placeholder="Positive components such as Basic, Bonus, HRA, etc."
              />
            </div>

            {/* Actions */}
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
                  <>{isEdit ? 'Update Category' : 'Create Category'}</>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/payroll/salary-categories')}
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
