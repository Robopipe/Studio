import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export type AuthFormKind =
  | "login"
  | "register"
  | "forgotPassword"
  | "resetPassword";

export interface MappedAuthError {
  message: string;
  action?: { label: string; to: string };
}

const GENERIC = "Something went wrong. Please try again.";

export const isFetchBaseQueryError = (
  error: unknown,
): error is FetchBaseQueryError =>
  typeof error === "object" && error != null && "status" in error;

export const mapAuthError = (
  error: unknown,
  kind: AuthFormKind,
): MappedAuthError => {
  if (isFetchBaseQueryError(error)) {
    const { status } = error;

    // Network / parse / timeout / custom errors have a string status code
    if (typeof status === "string") {
      return { message: GENERIC };
    }

    if (kind === "login" && status === 401) {
      return { message: "Incorrect email or password." };
    }

    if (kind === "register" && status === 409) {
      return {
        message: "An account with this email already exists.",
        action: { label: "Log in instead", to: "/login" },
      };
    }

    if (kind === "resetPassword" && (status === 401 || status === 404)) {
      return {
        message:
          "This reset link is invalid or has expired. Please request a new one.",
      };
    }

    // 5xx and any other unhandled status
    return { message: GENERIC };
  }

  // SerializedError or any non-FetchBaseQueryError
  return { message: GENERIC };
};

/**
 * Extracts the first error message per field from a ZodError's issues array.
 * Messages come from the schema definitions in @repo/schema.
 */
export const fieldErrorsFromZod = (error: {
  issues: Array<{ path: Array<string | number | symbol>; message: string }>;
}): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !out[field]) {
      out[field] = issue.message;
    }
  }
  return out;
};
