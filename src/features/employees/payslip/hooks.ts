import { useQuery, useMutation } from '@tanstack/react-query';
import { payslipApi, PayslipResponse } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { toast } from 'react-hot-toast';
import { emitApiError } from '../../../lib/error-bus';
import { parseApiError } from '../../../utils/parseApiError';

// ----------------- FETCH EXISTING PAYSLIP -----------------
export function usePayslip(employeeId: string, month: string, enabled: boolean) {
  const { organization_id } = useAuth();

  return useQuery<PayslipResponse>({
    queryKey: ['payslip', organization_id, employeeId, month],
    queryFn: () => payslipApi.get(organization_id!, employeeId, month, 1, 0),
    enabled: enabled && !!organization_id && !!employeeId && !!month,
    staleTime: 0, // always fresh
  });
}

// ----------------- GENERATE NEW PAYSLIP -----------------
export function useGeneratePayslip(onSuccess?: () => void) {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      employeeId,
      month,
      skipProRate,
      skipLeaveFlag,
      comment,
    }: {
      employeeId: string;
      month: string;
      skipProRate: boolean;
      skipLeaveFlag: boolean;
      comment?: string;
    }) => {
      if (!organization_id) throw new Error("Missing organization_id");

      return payslipApi.generate(
        organization_id,
        employeeId,
        month,
        skipProRate,
        skipLeaveFlag,
        comment
      );
    },

    onSuccess: (res: any) => {
      // Backend returns 200 with STORAGE_LIMIT_EXCEEDED
      if (res?.message === "STORAGE_LIMIT_EXCEEDED") {
        emitApiError({
          message:
            "Your storage limit has been reached. Please upgrade your subscription plan to generate new payslips.",
        });
        return;
      }

      onSuccess?.();
    },

    onError: (err: any) => {
      emitApiError(parseApiError(err));
    },
  });
}


// ----------------- FETCH PAYSLIP AUDIT HISTORY (SERVER PAGINATION) -----------------
export function usePayslipAudit(employeeId: string, month: string, page: number, limit: number, enabled: boolean) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ['payslipAudit', organization_id, employeeId, month, page, limit],
    queryFn: () =>
      payslipApi.getAudit(organization_id!, employeeId, month, page, limit),
    enabled: enabled && !!organization_id && !!employeeId && !!month,
    staleTime: 0,
  });
}


// ----------------- APPLY PAYSLIP ADJUSTMENTS -----------------
export function useAdjustPayslip(onSuccess?: () => void) {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      employeeId,
      month,
      adjustments,
      comments,
    }: {
      employeeId: string;
      month: string;
      adjustments: Array<{
        component_id: string;
        field: 'amount';
        old_value: number;
        new_value: number;
        comment?: string | null;
      }>;
      comments?: string | null;
    }) => {
      if (!organization_id) throw new Error('Missing organization_id');
      return payslipApi.adjust(organization_id, employeeId, month, adjustments, comments);
    },
    onSuccess: () => {
      toast.success('Adjustments saved successfully');
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err.message || 'Failed to save adjustments';
      toast.error(msg);
    },
  });
}

// ----------------- PAYROLL PROGRESS KPI -----------------
export function usePayrollProgress(month: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ['payrollProgress', organization_id, month],
    queryFn: () => payslipApi.getPayrollProgress(organization_id!, month),
    enabled: !!organization_id && !!month,
    staleTime: 60 * 1000, // cache for 1 minute
  });
}

// src/modules/payroll/payslip/hooks.ts

export function useDownloadPayslipPDF() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async ({
      employeeId,
      month,
      auditId, // optional camelCase key in frontend call
    }: {
      employeeId: string;
      month?: string;
      auditId?: string;
    }) => {
      if (!organization_id) {
        throw new Error("Missing organization_id");
      }

      // ✅ send `audit_id` exactly as backend expects
      return payslipApi.download(organization_id, employeeId, {
        month,
        audit_id: auditId, // 👈 snake_case key matches backend
      });
    },

    onError: (err: any) => {
      
    },
  });
}
