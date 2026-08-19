import { api } from '../../../lib/axios';

export type Holiday = {
  id: string;
  organization_id: string;
  name: string;
  date: string;      // YYYY-MM-DD
  country: string;
  created_at?: string;
  updated_at?: string;
};

export type CreateHolidayInput = Omit<Holiday, 'id' | 'organization_id' | 'created_at' | 'updated_at'>;
export type UpdateHolidayInput = Partial<Omit<Holiday, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;

export type HolidaysResponse = {
  holidays: Holiday[];
  paginationMetaInfo: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

const base = (orgId: string) => `/organization/${orgId}/holidays`;

export async function listHolidays(
  orgId: string,
  page: number,
  limit: number,
  year?: number
): Promise<HolidaysResponse> {
  const params: Record<string, any> = { page, limit };
  if (year) params.year = year; // ✅ send year to backend

  const { data } = await api.get(base(orgId), { params });

  if (data?.paginationMetaInfo) {
    return { holidays: data.holidays ?? [], paginationMetaInfo: data.paginationMetaInfo };
  }

  const all: Holiday[] = Array.isArray(data) ? data : (data?.holidays ?? []);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  return {
    holidays: paged,
    paginationMetaInfo: {
      totalCount: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / limit)),
      currentPage: page,
      limit,
    },
  };
}


export const holidaysApi = {
  list: listHolidays,
  get: async (orgId: string, holidayId: string) => {
    const { data } = await api.get(`${base(orgId)}/${holidayId}`);
    return data as Holiday;
  },
  create: async (orgId: string, input: CreateHolidayInput) => {
    const { data } = await api.post(base(orgId), input);
    return data as Holiday;
  },
  update: async (orgId: string, holidayId: string, input: UpdateHolidayInput) => {
    const { data } = await api.patch(`${base(orgId)}/${holidayId}`, input);
    return data as Holiday;
  },
  remove: async (orgId: string, holidayId: string) => {
    const { data } = await api.delete(`${base(orgId)}/${holidayId}`);
    return data as { message: string };
  },

  import: async (orgId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`${base(orgId)}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as { message: string; imported: number };
  },

  export: async (orgId: string, year?: number): Promise<Blob> => {
      const url = `${base(orgId)}/export`;
      const params = year ? { year } : undefined;

      const { data } = await api.get(url, {
        params,
        responseType: "blob",
      });

      return data as Blob;
    },

  // ✅ New: pull public holidays from Google Calendar for a given year
  pullFromGoogle: async (orgId: string, year: number) => {
    // Backend endpoint you’ll implement against calendar-json.googleapis.com
    // method can be POST or GET; here we’ll assume POST with {year}
    const { data } = await api.post(`${base(orgId)}/google-pull`, { year });
    // expect { imported: number, message?: string }
    return data as { imported: number; message?: string };
  },
};
