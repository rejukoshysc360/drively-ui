import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { subscriptionsApi } from "./api";

import { useAuth } from "../auth/AuthProvider";

export function useCurrentSubscription() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["subscription", organization_id],

    queryFn: () => subscriptionsApi.getCurrentSubscription(organization_id!),

    enabled: !!organization_id,
  });
}

export function useCreateOrder(orgId?: string) {
  return useMutation({
    mutationFn: (payload: {
      plan: string;
      billing_cycle: "monthly" | "annual";
      organization_name?: string;
      admin_name?: string;
      email?: string;
      phone?: string;
      gstin?: string;
      country_code?: "IN" | "AE";
      mode: "upgrade" | "new-org" | "existing-paid-org" | "renew";
    }) => subscriptionsApi.createOrder(orgId, payload),
  });
}

export function useVerifyPayment() {
  const { organization_id } = useAuth();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) =>
      subscriptionsApi.verifyPayment(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subscription", organization_id],
      });

      queryClient.invalidateQueries({
        queryKey: ["billing-history", organization_id],
      });

      queryClient.invalidateQueries({
        queryKey: ["linked-organizations", organization_id],
      });

      queryClient.invalidateQueries({
        queryKey: ["storage-usage", organization_id],
      });
    },
  });
}
export function useBillingHistory() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["billing-history", organization_id],

    queryFn: () => subscriptionsApi.getBillingHistory(organization_id!),

    enabled: !!organization_id,
  });
}

export function useCancelSubscription() {
  const { organization_id } = useAuth();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionsApi.cancelSubscription(organization_id!),

    onSuccess: () => {
      // Immediate UI update
      queryClient.setQueryData(
        ["subscription", organization_id],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            auto_renew: false,
            cancelled_at: new Date().toISOString(),
          };
        },
      );

      // Refresh from server
      queryClient.invalidateQueries({
        queryKey: ["subscription", organization_id],
      });

      queryClient.invalidateQueries({
        queryKey: ["billing-history", organization_id],
      });
    },
  });
}

export function useLinkedOrganizations() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: [
      "linked-organizations",
      organization_id,
    ],

    queryFn: () =>
      subscriptionsApi.getLinkedOrganizations(
        organization_id!
      ),

    enabled: !!organization_id,
  });
}

export function useCreateFreeOrganization() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (payload: {
      organization_name: string;
      admin_name?: string;
      email?: string;
      phone?: string;
      gstin?: string;
      country_code?: "IN" | "AE";
    }) =>
      subscriptionsApi.createFreeOrganization(
        organization_id,
        payload
      ),
  });
}
export function useStorageUsage() {
  const { organization_id } = useAuth();

  return useQuery({
    queryKey: ["storage-usage", organization_id],
    queryFn: () =>
      subscriptionsApi.getStorageUsage(
        organization_id!
      ),
    enabled: !!organization_id,
  });
}
export function useRenewSubscriptionDetails(
  email: string
) {
  return useQuery({
    queryKey: ["renew-subscription", email],

    queryFn: () =>
      subscriptionsApi.getRenewSubscriptionDetails(
        email
      ),

    enabled: !!email,
  });
}

export function useVerifyRenewSubscription() {
  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
    }) =>
      subscriptionsApi.verifyRenewSubscription(
        payload.email,
        payload.password,
      ),
  });
}