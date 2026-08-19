import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrAnnouncementsApi, HrAnnouncement } from './api';
import { useAuth } from '../auth/AuthProvider';
import { emitApiError } from '../../lib/error-bus';
import { emitSuccess } from '../../lib/success-bus';
import { parseApiError } from '../../utils/parseApiError';

// 🔹 Unified key (no role dependence)
const keys = {
  list: (orgId: string, page: number, limit: number, search?: string) =>
    ['hr-announcements', orgId, page, limit, search ?? ''] as const,
  base: (orgId: string) => ['hr-announcements', orgId] as const,
};

/**
 * 🚀 Always fresh — no caching
 */
export function useHrAnnouncements(page: number, limit: number, search?: string) {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: keys.list(organization_id!, page, limit, search),
    queryFn: () => hrAnnouncementsApi.list(organization_id!, page, limit, search),

    // Disable all caching
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always', 
    enabled: !!organization_id,
  });
}

/**
 * ➕ Create
 */
export function useCreateAnnouncement() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<HrAnnouncement, 'id'>) =>
      hrAnnouncementsApi.create(organization_id!, input),

    onSuccess: () => {
      emitSuccess({ message: 'Announcement created successfully', type: 'success' });

      // Invalidate all announcement data
      qc.invalidateQueries({ queryKey: keys.base(organization_id!) });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * ✏️ Update
 */
export function useUpdateAnnouncement(id: string) {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<HrAnnouncement>) =>
      hrAnnouncementsApi.update(organization_id!, id, input),

    onSuccess: () => {
      emitSuccess({ message: 'Announcement updated successfully', type: 'success' });
      qc.invalidateQueries({ queryKey: keys.base(organization_id!) });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

/**
 * 🗑️ Delete
 */
export function useDeleteAnnouncement() {
  const { organization_id } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => hrAnnouncementsApi.remove(organization_id!, id),

    onSuccess: () => {
      emitSuccess({ message: 'Announcement deleted', type: 'success' });
      qc.invalidateQueries({ queryKey: keys.base(organization_id!) });
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}


/**
 * 🖼️ Upload Announcement Image
 */
export function useUploadAnnouncementImage() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (file: File) =>
      hrAnnouncementsApi.uploadImage(organization_id!, file),

    onSuccess: (data) => {
      emitSuccess({ message: "Image uploaded successfully", type: "success" });
      return data;
    },

    onError: (err) => emitApiError(parseApiError(err)),
  });
}

export function useAnnouncementImageUrl() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (key: string) =>
      hrAnnouncementsApi.getImageUrl(organization_id!, key),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}
