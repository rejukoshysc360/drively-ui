import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { holidaysApi, CreateHolidayInput, UpdateHolidayInput } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { parseApiError } from '../../../utils/parseApiError';
import { emitApiError } from '../../../lib/error-bus';

const keys = {
  list: (orgId: string, page: number, limit: number, year?: number) =>
    ['holidays', orgId, page, limit, year] as const,
  one: (orgId: string, id: string) => ['holidays', orgId, id] as const,
};


export function useHolidays(page: number, limit: number, year?: number) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.list(organization_id, page, limit, year) : ['holidays', 'no-org'],
    queryFn: () => holidaysApi.list(organization_id!, page, limit, year),
    enabled: !!organization_id,
    keepPreviousData: true,
  });
}

export function useHoliday(holidayId: string) {
  const { organization_id } = useAuth();
  return useQuery({
    queryKey: organization_id ? keys.one(organization_id, holidayId) : ['holiday', 'no-org', holidayId],
    queryFn: () => holidaysApi.get(organization_id!, holidayId),
    enabled: !!organization_id && !!holidayId,
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: CreateHolidayInput) => holidaysApi.create(organization_id!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays', organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useUpdateHoliday(holidayId: string) {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateHolidayInput) => holidaysApi.update(organization_id!, holidayId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays', organization_id] });
      qc.invalidateQueries({ queryKey: ['holidays', organization_id, holidayId] });
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (holidayId: string) => holidaysApi.remove(organization_id!, holidayId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays', organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useImportHolidays() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (file: File) => holidaysApi.import(organization_id!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays', organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useExportHolidays() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: async (year?: number) => {
      if (!organization_id) throw new Error("Organization ID is missing");

      // Pass year as query param if provided, otherwise export all (fallback)
      const blob = await holidaysApi.export(organization_id, year);
      return { blob, year: year || "all" };
    },
    onError: (err) => emitApiError(parseApiError(err)),
  });
}

// ✅ New: pull Google Calendar public holidays
export function usePullGoogleHolidays() {
  const qc = useQueryClient();
  const { organization_id } = useAuth();
  return useMutation({
    mutationFn: (vars: { year: number }) => holidaysApi.pullFromGoogle(organization_id!, vars.year),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays', organization_id] }),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
