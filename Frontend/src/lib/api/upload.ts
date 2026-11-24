import { z } from "zod";
import {
  errorResponseSchema,
  fileAssetSchema,
  type ErrorCode,
  type FileAsset,
} from "@/contracts/common";
import { UPLOAD_TIMEOUT_MS, buildUrl } from "./client";
import { ApiError, type ApiErrorCode } from "./errors";
import { getMockScenarioHeaders } from "./mock-scenario";
import { handleForbidden, handleUnauthorized } from "./session";
import { getSessionAdapter } from "./session-adapter";

const UPLOAD_PATH = "/files";

const envelopeSchema = z.object({ data: fileAssetSchema });

export type UploadOptions = {
  /** Called with 0–100 while the file is being sent */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

function clientError(code: ApiErrorCode, message: string, cause?: unknown) {
  return new ApiError({ status: 0, code, message, cause });
}

function parseJson(text: string): unknown {
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}

const HTTP_CODE: Record<number, ErrorCode> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
};

/**
 * `POST /files` with real upload progress.
 *
 * `fetch` cannot report upload progress, so this uses `XMLHttpRequest` while
 * keeping the client's conventions: session headers, mock scenario header,
 * contract validation and `ApiError` for every failure.
 */
export function uploadFileWithProgress(
  file: File,
  { onProgress, signal }: UploadOptions = {},
): Promise<FileAsset> {
  return new Promise<FileAsset>((resolve, reject) => {
    if (signal?.aborted) {
      reject(clientError("ABORTED", "آپلود لغو شد."));
      return;
    }

    const body = new FormData();
    body.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", buildUrl(UPLOAD_PATH));
    xhr.withCredentials = true;
    xhr.timeout = UPLOAD_TIMEOUT_MS;
    xhr.responseType = "text";

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...getMockScenarioHeaders(),
      ...getSessionAdapter().getRequestHeaders(UPLOAD_PATH),
    };
    for (const [name, value] of Object.entries(headers)) {
      xhr.setRequestHeader(name, value);
    }

    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    const cleanup = () => signal?.removeEventListener("abort", onAbort);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      cleanup();
      const payload = parseJson(xhr.responseText);

      if (xhr.status >= 200 && xhr.status < 300) {
        const parsed = envelopeSchema.safeParse(payload);
        if (!parsed.success) {
          reject(
            clientError("INVALID_RESPONSE", "پاسخ دریافتی از سرور معتبر نیست.", parsed.error),
          );
          return;
        }
        onProgress?.(100);
        resolve(parsed.data.data);
        return;
      }

      const parsedError = errorResponseSchema.safeParse(payload);
      const code: ApiErrorCode = parsedError.success
        ? parsedError.data.error.code
        : (HTTP_CODE[xhr.status] ?? (xhr.status >= 500 ? "INTERNAL" : "UNKNOWN"));
      const retryHeader = xhr.getResponseHeader("Retry-After");
      const parsedRetry = retryHeader ? parseInt(retryHeader, 10) : undefined;
      const retryAfter = Number.isFinite(parsedRetry) ? parsedRetry : undefined;

      const error = new ApiError({
        status: xhr.status,
        code,
        message: parsedError.success
          ? parsedError.data.error.message
          : "آپلود فایل انجام نشد. دوباره تلاش کنید.",
        fields: parsedError.success ? parsedError.data.error.fields : undefined,
        retryAfter,
      });
      if (error.status === 401) handleUnauthorized();
      else if (error.status === 403) handleForbidden(error);
      reject(error);
    };

    xhr.onerror = () => {
      cleanup();
      reject(
        clientError(
          "NETWORK_ERROR",
          "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.",
        ),
      );
    };
    xhr.ontimeout = () => {
      cleanup();
      reject(clientError("TIMEOUT", "آپلود بیش از حد طول کشید. دوباره تلاش کنید."));
    };
    xhr.onabort = () => {
      cleanup();
      reject(clientError("ABORTED", "آپلود لغو شد."));
    };

    xhr.send(body);
  });
}
