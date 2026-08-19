// src/features/organizations/settings/leave-policy/api.ts
import { api } from '../../../../lib/axios';

export type LeavePolicy = {
  id: string;
  organization_id: string;
  leave_type: string;       // annual | sick | maternity | casual | public
  entitlement_days: number;
  full_pay_days?: number;
  half_pay_days?: number;
  unpaid_days?: number;

  is_accruable?: boolean;
  is_carry_forward_enabled?: boolean;
  carry_forward_limit?: number;
  carry_forward_policy?: string;

  // NEW
  carry_forward_expiry_months?: number;

  created_at?: string;
  updated_at?: string;
  show_to_employees?: boolean;
  is_encashable_on_exit?: boolean;
};

export type CreateLeavePolicyInput = Omit<
  LeavePolicy,
  'id' | 'organization_id' | 'created_at' | 'updated_at'
>;
export type UpdateLeavePolicyInput = Partial<CreateLeavePolicyInput>;

export type LeavePoliciesResponse = {
  policies: LeavePolicy[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) => `/organization/${orgId}/leave-policies`;

/**
 * ✅ Updated: Supports optional `employeeId`
 * If provided, backend will resolve organization via that employee.
 */
export async function listLeavePolicies(
  orgId: string,
  page: number,
  limit: number,
  employeeId?: string
): Promise<LeavePoliciesResponse> {
  const params: Record<string, any> = { page, limit };
  if (employeeId) params.employee_id = employeeId; // 👈 send to backend

  const { data } = await api.get(base(orgId), { params });

  if (data?.paginationMetaInfo) {
    return {
      policies: data.policies ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  // Fallback for non-paginated responses
  const all: LeavePolicy[] = Array.isArray(data)
    ? data
    : (data?.policies ?? []);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  return {
    policies: paged,
    paginationMetaInfo: {
      totalCount: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / limit)),
      currentPage: page,
      limit,
    },
  };
}

export const leavePoliciesApi = {
  list: listLeavePolicies,

  get: async (orgId: string, policyId: string) => {
    const { data } = await api.get(`${base(orgId)}/${policyId}`);
    return data as LeavePolicy;
  },

  create: async (orgId: string, input: CreateLeavePolicyInput) => {
    const { data } = await api.post(base(orgId), input);
    return data as LeavePolicy;
  },

  update: async (
    orgId: string,
    policyId: string,
    input: UpdateLeavePolicyInput
  ) => {
    const { data } = await api.patch(`${base(orgId)}/${policyId}`, input);
    return data as LeavePolicy;
  },

  remove: async (orgId: string, policyId: string) => {
    const { data } = await api.delete(`${base(orgId)}/${policyId}`);
    return data as { message: string };
  },
};
