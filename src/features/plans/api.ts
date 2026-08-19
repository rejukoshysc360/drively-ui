import { api } from "../../lib/axios";

const base = (orgId: string) =>
  `/organization/${orgId}/subscriptions`;

export const subscriptionsApi = {
  createOrder: async (
    orgId: string | undefined,
    payload: any
  ) => {
    const url = orgId
      ? `${base(orgId)}/create-order`
      : `/public/subscriptions/create-order`;

    const { data } = await api.post(
      url,
      payload
    );

    return data;
  },

verifyPayment: async (
  payload: any
) => {
  const url =
    payload.is_public_signup
      ? "/public/subscriptions/verify-payment"
      : `/organization/${payload.organization_id}/subscriptions/verify-payment`;

  const { data } =
    await api.post(url, payload);

  return data;
},

  getCurrentSubscription: async (
    orgId: string
  ) => {
    const { data } = await api.get(
      `${base(orgId)}/current`
    );

    return data;
  },
  verifyRenewSubscription: async (
  email: string,
  password: string,
) => {
  const { data } = await api.post(
    "/public/subscriptions/renew/verify",
    {
      email,
      password,
    },
  );

  return data;
},
  getRenewSubscriptionDetails: async (
  email: string
) => {
  const { data } = await api.post(
    "/public/subscriptions/renew/details",
    {
      email,
    }
  );

  return data;
},
   getBillingHistory: async (
    orgId: string
  ) => {
    const { data } = await api.get(
      `${base(orgId)}/history`
    );

    return data;
  },

  cancelSubscription: async (
    orgId: string
  ) => {
    const { data } = await api.post(
      `${base(orgId)}/cancel`
    );

    return data;
  },
 getLinkedOrganizations: async (
    orgId: string
  ) => {
    const { data } = await api.get(
      `${base(orgId)}/linked`
    );

    return data;
  },

  createFreeOrganization: async (
    orgId: string | undefined,
    payload: any
  ) => {
    const url = orgId
      ? `${base(orgId)}/free`
      : `/public/subscriptions/free`;

    const { data } = await api.post(
      url,
      payload
    );

    return data;
  },
    getStorageUsage: async (orgId: string) => {
    const { data } = await api.get(
      `/organization/${orgId}/storage-usage`
    );

    return data;
  },
  
};