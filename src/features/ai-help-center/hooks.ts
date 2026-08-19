// src/hooks/useAiHelp.ts
import { useMutation } from "@tanstack/react-query";
import { aiApi } from "./api";
import { useAuth } from "../auth/AuthProvider";
import { emitApiError } from "../../lib/error-bus";
import { parseApiError } from "../../utils/parseApiError";

export function useAiHelp() {
  const { organization_id } = useAuth();

  return useMutation({
    mutationFn: (message: string) => aiApi.ask(organization_id!, message),
    onError: (err) => emitApiError(parseApiError(err)),
  });
}