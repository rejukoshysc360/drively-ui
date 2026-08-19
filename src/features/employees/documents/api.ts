import { api } from "../../../lib/axios";

export type UploadedFile = {
  id?: string;
  name?: string;
  key: string;
  s3Url: string;
  extractedText?: string;
  size?: number;
  lastModified?: string;
};

type UploadOptions = {
  onProgress?: (percent: number) => void;
};

type EmployeeDocumentsResponse = {
  documents: UploadedFile[];
  paginationMetaInfo: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

// 🟢 FIXED: Ensure both onboarding and compliance supported — no forced default fallback
export type DocumentCategory = "onboarding" | "compliance";

// ---------------------------------------------------------------------------
// 🧩 Helper to build base document routes for both onboarding & compliance
// ---------------------------------------------------------------------------
// 🟢 FIX: remove default "onboarding" fallback — always use explicit type
const base = (orgId: string, employeeId?: string, type: DocumentCategory) => {
  return employeeId
    ? `/organization/${orgId}/hr-management/employees/${employeeId}/documents/${type}`
    : `/organization/${orgId}/hr-management/employee-self/documents/${type}`;
};

const base_generic = (orgId: string,type: DocumentCategory) => {
  return`/organization/${orgId}/hr-management/generic/documents/${type}`;
};

// ---------------------------------------------------------------------------
// 📦 documentsApi — unified for both Onboarding & Compliance Documents
// ---------------------------------------------------------------------------
export const documentsApi = {
  // --- Upload Document ---
  uploadDb: async (
    orgId: string,
    employeeId: string | undefined,
    file: File,
    name: string,
    type: DocumentCategory,
    opts?: UploadOptions
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);

    const { data } = await api.post(base(orgId, employeeId, type), formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (!opts?.onProgress || !evt.total) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        opts.onProgress(pct);
      },
    });

    return data as UploadedFile;
  },

  // --- List Documents ---
  // 🟢 FIX: removed default "onboarding" here too — always pass explicit type
listDb: async (
  orgId: string,
  employeeId: string | undefined,
  type: DocumentCategory,
  page = 1,
  limit = 20
): Promise<EmployeeDocumentsResponse> => {
  const { data } = await api.get(
    `${base(orgId, employeeId, type)}?page=${page}&limit=${limit}`
  );

  return data as EmployeeDocumentsResponse;
},

  // --- Delete Document ---
  removeDb: async (
    orgId: string,
    employeeId: string | undefined,
    docId: string,
    type: DocumentCategory
  ) => {
    const { data } = await api.delete(`${base(orgId, employeeId, type)}/${docId}`);
    return data as { message: string };
  },

  // --- Get Document Download URL ---
  getDownloadUrl: async (
    orgId: string,
    employeeId: string | undefined,
    docId: string,
    type: DocumentCategory
  ) => {
    const { data } = await api.get(`${base(orgId, employeeId, type)}/${docId}/download`);
    return data as { url: string };
  },

  // --- Send Onboarding Email (only for onboarding type) ---
  sendOnboardingEmail: async (orgId: string, employeeId: string) => {
    const { data } = await api.post(
      `/organization/${orgId}/hr-management/employees/${employeeId}/onboarding-email`
    );
    return data;
  },
};

type GenericDocumentsResponse = {
  documents: UploadedFile[];
  paginationMetaInfo: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};


// ---------------------------------------------------------------------------
// 🟢 Generic (Organization-Level) Document APIs (non-breaking extension)
// ---------------------------------------------------------------------------
export const genericDocumentsApi = {
  uploadDb: async (
    orgId: string,
    file: File,
    name: string,
    type: DocumentCategory = "onboarding",
    opts?: UploadOptions
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);

    const { data } = await api.post(
      `${base_generic(orgId, type)}?uploadType=generic`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!opts?.onProgress || !evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          opts.onProgress(pct);
        },
      }
    );

    return data as UploadedFile;
  },

listDb: async (
  orgId: string,
  type: DocumentCategory = "onboarding",
  page = 1,
  limit = 20
): Promise<GenericDocumentsResponse> => {
  const { data } = await api.get(
    `${base_generic(orgId, type)}?uploadType=generic&page=${page}&limit=${limit}`
  );

  return data as GenericDocumentsResponse;
},

  removeDb: async (orgId: string, docId: string, type: DocumentCategory = "onboarding") => {
    const { data } = await api.delete(
      `${base(orgId, undefined, type)}/${docId}?uploadType=generic`
    );
    return data as { message: string };
  },

  getDownloadUrl: async (
    orgId: string,
    docId: string,
    type: DocumentCategory = "onboarding"
  ) => {
    const { data } = await api.get(
      `${base(orgId, undefined, type)}/${docId}/download?uploadType=generic`
    );
    return data as { url: string };
  },
sendBulkOnboardingDocuments: async (
  orgId: string,
  payload: { employee_ids: string[]; document_ids: string[] }
) => {
  const { data } = await api.post(
    `/organization/${orgId}/hr-management/onboarding-documents/send`,
    payload
  );
  return data;
},
};
