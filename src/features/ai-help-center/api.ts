// src/api/aiApi.ts
import { api } from "../../lib/axios";

export type AiHelpResponse = {
  reply: string;
};

const base = (orgId: string) => `/organization/${orgId}/ai/help`;

export const aiApi = {
  ask: async (orgId: string, message: string): Promise<AiHelpResponse> => {
    const { data } = await api.post(base(orgId), { message });
    return data;
  },
};