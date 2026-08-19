export type ParsedApiError = {
  message: string;
  status?: number;
  code?: string;
  showForgotPassword?: boolean;
  raw?: unknown;
};

export function parseApiError(err: unknown): ParsedApiError {
  // Axios style
  // @ts-ignore
  const res = err?.response;
  // @ts-ignore
  const data = res?.data;

  const msg =
    (data?.message as string) ||
    (data?.error as string) ||
    (Array.isArray(data?.errors) && data.errors[0]?.message) ||
    (typeof data === "string" && data) ||
    // @ts-ignore
    err?.message ||
    "Something went wrong";

  return {
    message: msg,
    status: res?.status,
    code: data?.code,
    showForgotPassword: data?.showForgotPassword,
    raw: err,
  };
}