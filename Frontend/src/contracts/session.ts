/**
 * Session transport + OTP constants of the public contract.
 *
 * Dependency-free on purpose (no zod): it is imported by `src/proxy.ts`, the
 * API client and the mock API alike.
 */

/**
 * Name of the httpOnly cookie that carries the session. The backend sets it
 * with `Set-Cookie` on login (OTP verify / staff login) and clears it on
 * logout. Clients never read or write it — they only send it back via
 * `credentials: "include"`. This is the ONLY authentication mechanism of the
 * public contract (see `securitySchemes.sessionCookie` in `docs/openapi.yaml`).
 */
export const SESSION_COOKIE_NAME = "session";

/** Key of the (only) security scheme in the OpenAPI document */
export const SESSION_SECURITY_SCHEME = "sessionCookie";

/** OTP lifetime — a code is rejected 2 minutes after it was sent */
export const OTP_EXPIRES_IN_SECONDS = 120;
/** Minimum wait before a new OTP can be requested for the same number */
export const OTP_RESEND_AFTER_SECONDS = 60;
/** OTP requests allowed per mobile number per hour */
export const OTP_MAX_REQUESTS_PER_HOUR = 5;
/** Wrong codes allowed per OTP; the code is invalidated after the 3rd failure */
export const OTP_MAX_VERIFY_ATTEMPTS = 3;
