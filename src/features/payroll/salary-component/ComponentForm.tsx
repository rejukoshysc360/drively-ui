// src/payroll/salary-component/ComponentForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from "@tanstack/react-query";
import {
  useComponent,
  useCreateComponent,
  useUpdateComponent,
  useAllComponents,
  useUpdateRule,
  useCreateRule,
} from './hooks';
import { Calculator, Loader2, Plus, Trash2 } from 'lucide-react';

type FormValues = {
  code: string;
  name: string;
  description?: string | null;
  rule_type: 'FIXED_AMOUNT' | 'PERCENT_OF_COMPONENT' | 'FORMULA';
  fixed_amount?: number | null;
  percent_rate?: number | null;
  percent_reference_component_id?: string | null;
  is_active: boolean;
};

type FormulaRule = {
  type: 'PERCENT_OF_COMPONENT';
  percent: number;
  component_id: string;
};

type FormulaJSON = {
  operator: 'AND' | 'OR';
  rules: FormulaRule[];
};

export default function ComponentForm() {
  const params = useParams<{ categoryId: string; componentId?: string }>();
  const categoryId = params.categoryId!;
  const componentId = params.componentId;
  const isEdit = Boolean(componentId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useComponent(componentId!, { enabled: isEdit });
  const create = useCreateComponent();
  const update = useUpdateComponent(componentId || '');
  const updateRule = useUpdateRule();
  const createRule = useCreateRule();

  const { data: allComponents } = useAllComponents();
  const components = allComponents ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      rule_type: 'FIXED_AMOUNT',
      fixed_amount: undefined,
      percent_rate: undefined,
      percent_reference_component_id: null,
      is_active: true,
    },
  });

  const [formula, setFormula] = useState<FormulaJSON>({
    operator: 'AND',
    rules: [],
  });

  const calculationType = watch('rule_type');

  // ✅ Improved: Reset only when fresh data (avoids stale prefill)
  useEffect(() => {
    if (!data || isLoading) return;

    reset({
      code: data.code || '',
      name: data.name || '',
      description: data.description ?? '',
      rule_type: (data.rules?.[0]?.rule_type as any) ?? 'FIXED_AMOUNT',
      fixed_amount: data.rules?.[0]?.fixed_amount ?? null,
      percent_rate: data.rules?.[0]?.percent_rate ?? null,
      percent_reference_component_id:
        data.rules?.[0]?.percent_reference_component_id ?? null,
      is_active: Boolean(data.is_active),
    });

    if (data.rules?.[0]?.formula) {
      try {
        const parsed = JSON.parse(data.rules[0].formula);
        setFormula(parsed);
      } catch {
        setFormula({ operator: 'AND', rules: [] });
      }
    }
  }, [data?.id, isLoading, reset]);

  // ✅ Improved: Ensure Reference Component pre-populates reliably
  useEffect(() => {
    if (!data?.rules?.[0] || !allComponents?.length) return;
    const rule = data.rules[0];
    const refId = rule.percent_reference_component_id;
    if (!refId) return;

    if (allComponents.some((c) => c.id === refId)) {
      setValue('percent_reference_component_id', refId, {
        shouldValidate: true,
      });
    }
  }, [data?.id, allComponents?.length, setValue]);

  const formulaText = formula.rules
    .map((r) => {
      const comp = components.find((c) => c.id === r.component_id);
      return `(${r.percent}% of [${comp?.code ?? ''} - ${comp?.name ?? ''}])`;
    })
    .join(` ${formula.operator} `);

  const addRule = () => {
    setFormula({
      ...formula,
      rules: [
        ...formula.rules,
        { type: 'PERCENT_OF_COMPONENT', percent: 0, component_id: '' },
      ],
    });
  };

  const updateRuleState = (idx: number, changes: Partial<FormulaRule>) => {
    const newRules = [...formula.rules];
    newRules[idx] = { ...newRules[idx], ...changes };
    setFormula({ ...formula, rules: newRules });
  };

  const removeRule = (idx: number) => {
    setFormula({
      ...formula,
      rules: formula.rules.filter((_, i) => i !== idx),
    });
  };

const onSubmit = async (values: FormValues) => {
  const definitionPayload = {
    code: values.code.trim(),
    name: values.name.trim(),
    description: values.description?.trim() || null,
    is_active: values.is_active,
    category_id: categoryId,
  };

  const rulePayload = {
    rule_type: values.rule_type,
    fixed_amount:
      values.rule_type === "FIXED_AMOUNT" ? values.fixed_amount : null,
    percent_rate:
      values.rule_type === "PERCENT_OF_COMPONENT"
        ? values.percent_rate
        : null,
    percent_reference_component_id:
      values.rule_type === "PERCENT_OF_COMPONENT"
        ? values.percent_reference_component_id
        : null,
    formula: values.rule_type === "FORMULA" ? JSON.stringify(formula) : null,
  };

  if (isEdit) {
    update.mutate(definitionPayload, {
      onSuccess: async () => {
        const existingRule = data?.rules?.[0];
        if (existingRule?.id) {
          updateRule.mutate(
            { ruleId: existingRule.id, payload: rulePayload },
            {
              onSuccess: async () => {
                // ✅ force refetch before navigate
                await Promise.all([
                  queryClient.invalidateQueries(["salary_components_all"]),
                  queryClient.invalidateQueries(["salary_components"]),
                ]);
                navigate(-1);
              },
            }
          );
        } else {
          createRule.mutate(
            { componentId: componentId!, payload: rulePayload },
            {
              onSuccess: async () => {
                await Promise.all([
                  queryClient.invalidateQueries(["salary_components_all"]),
                  queryClient.invalidateQueries(["salary_components"]),
                ]);
                navigate(-1);
              },
            }
          );
        }
      },
    });
  } else {
    create.mutate(
      { ...definitionPayload, ...rulePayload },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries(["salary_components_all"]),
            queryClient.invalidateQueries(["salary_components"]),
          ]);
          navigate(-1);
        },
      }
    );
  }
};


  const busy =
    create.isPending ||
    update.isPending ||
    updateRule.isPending ||
    createRule.isPending;

  return (
    <div className="p-4 sm:p-6 w-full mx-auto bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
      {/* Header */}
     {/* Header — Mobile: compact, Desktop: your original perfect look */}
<div className="mb-6 lg:mb-8">
  <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-2.5 lg:gap-3">
    <Calculator className="w-7 h-7 lg:w-8 lg:h-8 text-indigo-600" />
    {isEdit ? 'Edit Salary Component' : 'Create New Component'}
  </h1>
  <p className="text-sm lg:text-base text-slate-600 mt-1.5">
    Define how this payslip item is calculated
  </p>
</div>
      {/* Loading */}
      {isEdit && isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 animate-pulse max-w-3xl mx-auto">
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {(!isEdit || !isLoading) && (
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-200 max-w-3xl mx-auto">
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
                        message: 'Uppercase, numbers, underscore only',
                      }
                    : undefined,
                })}
                disabled={isEdit}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm transition ${
                  isEdit
                    ? 'bg-gray-50 text-gray-600 cursor-not-allowed'
                    : errors.code
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
                placeholder="HRA"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.code.message}
                </p>
              )}
              {isEdit && (
                <p className="mt-1 text-xs text-indigo-600">
                  Code is immutable
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Name <span className="text-red-600">*</span>
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm transition ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
                placeholder="House Rent Allowance"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Calculation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Calculation Type
              </label>
              <select
                {...register('rule_type')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="PERCENT_OF_COMPONENT">
                  Percentage of Component
                </option>
                <option value="FORMULA">Formula</option>
              </select>
            </div>

            {/* Fixed Amount */}
            {calculationType === 'FIXED_AMOUNT' &&
              !data?.rules?.[0]?.reference_type_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fixed Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('fixed_amount', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="5000.00"
                  />
                </div>
              )}

            {/* Percentage */}
            {calculationType === 'PERCENT_OF_COMPONENT' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Percent Rate <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register('percent_rate', {
                      required: 'Rate required',
                      valueAsNumber: true,
                      min: { value: 0, message: '≥ 0' },
                      max: { value: 100, message: '≤ 100%' },
                    })}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition ${
                      errors.percent_rate
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    placeholder="30"
                  />
                  {errors.percent_rate && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.percent_rate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reference Component <span className="text-red-600">*</span>
                  </label>
                  <select
                    {...register('percent_reference_component_id', {
                      required: 'Select component',
                    })}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white transition ${
                      errors.percent_reference_component_id
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                  >
                    <option value="">-- Select --</option>
                    {components
                      .filter((c) => c.id !== componentId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.salary_categories?.code} - {c.code} ({c.name})
                        </option>
                      ))}
                  </select>
                  {errors.percent_reference_component_id && (
                    <p className="mt-1 text-xs text-red-600">
                      {
                        errors.percent_reference_component_id
                          .message
                      }
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Formula Builder */}
            {calculationType === 'FORMULA' && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-indigo-900">
                    Formula Builder
                  </h3>
                  <button
                    type="button"
                    onClick={addRule}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Rule
                  </button>
                </div>

                {formula.rules.length === 0 ? (
                  <p className="text-sm text-gray-600 italic">
                    No rules. Add one to start.
                  </p>
                ) : (
                  <>
                    {formula.rules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg, p-3 bg-white rounded-lg border"
                      >
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={rule.percent}
                          onChange={(e) =>
                            updateRuleState(idx, {
                              percent: Number(e.target.value),
                            })
                          }
                          className="w-20 px-3 py-1.5 border rounded text-sm"
                        />
                        <span className="text-sm font-medium">%</span>
                        <select
                          value={rule.component_id}
                          onChange={(e) =>
                            updateRuleState(idx, {
                              component_id: e.target.value,
                            })
                          }
                          className="flex-1 px-3 py-1.5 border rounded text-sm bg-white"
                        >
                          <option value="">-- Select --</option>
                          {components
                            .filter((c) => c.id !== componentId)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.salary_categories?.code} - {c.code} (
                                {c.name})
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeRule(idx)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Combine:</span>
                      <select
                        value={formula.operator}
                        onChange={(e) =>
                          setFormula({
                            ...formula,
                            operator: e.target
                              .value as 'AND' | 'OR',
                          })
                        }
                        className="px-3 py-1.5 border rounded text-sm bg-white"
                      >
                        <option value="AND">AND</option>
                      </select>
                    </div>
                  </>
                )}

                {formulaText && (
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <p className="text-xs font-medium text-indigo-900">
                      Preview:
                    </p>
                    <p className="text-sm font-mono text-indigo-800 mt-1">
                      {formulaText}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Active */}
            <div className="flex items-center gap-3">
              <input
                id="is_active"
                type="checkbox"
                {...register('is_active')}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-gray-700"
              >
                Active
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
            <button
  type="submit"
  disabled={busy || update.isSuccess || updateRule.isSuccess || create.isSuccess || createRule.isSuccess}
  className={`
    w-full
    flex items-center justify-center gap-2
    px-5 py-2.5
    text-sm font-medium
    rounded-xl
    transition-all duration-150
    ${busy || update.isSuccess || updateRule.isSuccess || create.isSuccess || createRule.isSuccess
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}
  `}
>
  {(busy || update.isSuccess || updateRule.isSuccess || create.isSuccess || createRule.isSuccess) ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      {isEdit ? 'Updating...' : 'Creating...'}
    </>
  ) : (
    <>{isEdit ? 'Update Component' : 'Create Component'}</>
  )}
</button>
              <button
                type="button"
                onClick={() => navigate(-1)}
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
