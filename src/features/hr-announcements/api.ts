import { api } from '../../lib/axios';

export type HrAnnouncement = {
  id: string;
  organization_id: string;
  title: string;
  content_html: string;
  scheduled_at?: string | null;
  end_at?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type HrAnnouncementsResponse = {
  announcements: HrAnnouncement[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) => `/organization/${orgId}/hr-announcements`;

export async function listAnnouncements(
  orgId: string,
  page: number,
  limit: number,
  search?: string
): Promise<HrAnnouncementsResponse> {
  const params: Record<string, any> = { page, limit };
  if (search?.trim()) params.search = search.trim();

  const { data } = await api.get(base(orgId), { params });

  if (data?.paginationMetaInfo) {
    return {
      announcements: data.announcements ?? data.list ?? data.data ?? [],
      paginationMetaInfo: data.paginationMetaInfo,
    };
  }

  const all: HrAnnouncement[] = Array.isArray(data)
    ? data
    : data?.announcements ?? [];
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);
  const totalCount = all.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return {
    announcements: paged,
    paginationMetaInfo: {
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    },
  };
}

export async function createAnnouncement(
  orgId: string,
  payload: Omit<HrAnnouncement, 'id' | 'created_at' | 'updated_at'>
): Promise<HrAnnouncement> {
  const { data } = await api.post(base(orgId), payload);
  return data as HrAnnouncement;
}

export async function updateAnnouncement(
  orgId: string,
  id: string,
  payload: Partial<HrAnnouncement>
): Promise<HrAnnouncement> {
  const { data } = await api.patch(`${base(orgId)}/${id}`, payload);
  return data as HrAnnouncement;
}

export async function deleteAnnouncement(
  orgId: string,
  id: string
): Promise<{ message: string }> {
  const { data } = await api.delete(`${base(orgId)}/${id}`);
  return data;
}

/**
 * 🖼️ Upload announcement image → S3
 */
export async function uploadAnnouncementImage(
  orgId: string,
  file: File
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(
    `/organization/${orgId}/hr-announcements/upload`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return data; // { url: "https://bucket.s3.ap-south-1.amazonaws.com/..." }
}

/**
 * 🔹 Get presigned URL for announcement image
 */
export async function getAnnouncementImageUrl(orgId: string, key: string): Promise<{ url: string }> {
  const { data } = await api.get(`/organization/${orgId}/hr-announcements/image-url`, {
    params: { key },
  });
  return data;
}


export const hrAnnouncementsApi = {
  list: listAnnouncements,
  create: createAnnouncement,
  update: updateAnnouncement,
  remove: deleteAnnouncement,
  uploadImage: uploadAnnouncementImage,
  getImageUrl: getAnnouncementImageUrl,
};
