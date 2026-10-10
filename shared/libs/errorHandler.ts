import { AxiosError } from "axios";

export interface StandardError extends Error {
  message: string;
  statusCode?: number;
  details?: string;
}

function buildStandardError(params: {
  name: string;
  message: string;
  statusCode?: number;
  details?: string;
}): StandardError {
  const standardError = new Error(params.message) as StandardError;

  standardError.name = params.name;
  if (typeof params.statusCode === "number") {
    standardError.statusCode = params.statusCode;
  }
  if (typeof params.details === "string") {
    standardError.details = params.details;
  }

  return standardError;
}

export function handleError(error: unknown): StandardError {
  if (error instanceof AxiosError) {
    return buildStandardError({
      name: error.name,
      message: error.response?.data?.message || error.message,
      statusCode: error.response?.status,
      details: error.response?.data?.error || error.name,
    });
  } else if (error instanceof Error) {
    return buildStandardError({
      name: error.name,
      message: error.message,
      details: error.name,
    });
  } else {
    return buildStandardError({
      name: "Error",
      message:
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "An unknown error occurred",
    });
  }
}
