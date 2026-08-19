// src/features/organizations/hooks.ts

import { useQuery } from "@tanstack/react-query";
import { organizationApi } from "./api"; 
import { getToken } from "../../lib/storage";

export function useOrganizationLogo(organizationId?: string | null) {

    console.log(
    "useOrganizationLogo",
    organizationId,
    !!organizationId
  );
  
   const token = getToken();
  return useQuery({
    queryKey: ["organization-logo", organizationId],
    queryFn: () => organizationApi.getPhoto(organizationId!),
    enabled:
      !!token &&
      !!organizationId,
    staleTime: 1000 * 60 * 10,
  });
}