import { api } from "../../lib/axios";

export type EmailTemplate = {
  id?: string;
  organization_id: string;
  type: string;
  subject: string;
  html: string;
  updated_at?: string;
  created_at?: string;
};

const base = (orgId: string) => `/organization/${orgId}/email-templates`;

export const emailTemplatesApi = {
  /** 🔹 List all templates for the given organization */
  list: async (orgId: string): Promise<EmailTemplate[]> => {
    const { data } = await api.get(base(orgId));
    return Array.isArray(data) ? data : [];
  },

  /** 🔹 Get a single template by type */
  getByType: async (orgId: string, type: string): Promise<EmailTemplate> => {
    const { data } = await api.get(`${base(orgId)}/${type}`);
    return data as EmailTemplate;
  },

  /** 🔹 Create or update (upsert) a template */
  upsert: async (
    orgId: string,
    type: string,
    payload: { organization_id: string; subject: string; html: string }
  ): Promise<EmailTemplate> => {
    const { data } = await api.put(`${base(orgId)}/${type}`, payload);
    return data as EmailTemplate;
  },

  /** 🔹 Delete a template by type */
  remove: async (
    orgId: string,
    type: string
  ): Promise<{ message: string }> => {
    const { data } = await api.delete(`${base(orgId)}/${type}`);
    return data;
  },

  /** 🔹 Send an email using a saved template */
  sendEmail: async (
    orgId: string,
    payload: {
      to: string | string[];
      type: string;
      subject?: string;
      data?: Record<string, any>;
      attachments?: any[];
    }
  ): Promise<{ ok: boolean; message: string; messageId?: string }> => {
    const { data } = await api.post(`${base(orgId)}/sendEmail`, payload);
    return data;
  },
};
