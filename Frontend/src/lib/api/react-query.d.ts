import type { ApiError } from "./errors";

/** Every query/mutation error is an `ApiError` (see `client.ts`) */
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}
