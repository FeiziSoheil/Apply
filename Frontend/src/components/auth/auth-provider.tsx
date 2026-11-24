"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CurrentUser, Role } from "@/contracts/auth";
import { authKeys } from "@/features/auth/keys";
import { useLogout } from "@/features/auth/mutations";
import { authQueries } from "@/features/auth/queries";
import {
  clearSession,
  onSessionCleared,
  onSessionExpired,
} from "@/lib/api/session";
import { STUDENT_LOGIN_PATH, loginPathForRole } from "@/lib/auth/routes";
import { SessionExpiredDialog } from "./session-expired-dialog";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export type SessionState = {
  status: SessionStatus;
  /** `null` unless `status === "authenticated"` */
  user: CurrentUser | null;
  role: Role | null;
  /** The server dropped a session that was valid before (shows the dialog) */
  isExpired: boolean;
  isLoggingOut: boolean;
  /** Call after a successful login with `session.user` (the cookie/token is already set) */
  signIn: (user: CurrentUser) => void;
  /** Revokes the session, clears all client state and goes to the login page */
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

/**
 * Session of the signed-in user, from `GET /me` (TanStack Query).
 *
 * States: `loading` (first answer pending) | `authenticated` | `unauthenticated`.
 * Wrap only the trees that need a session — the `(auth)`, `(panel)` and
 * `(admin)` layouts. It must sit inside `QueryProvider`.
 *
 * Session end is detected from three sources, all converging on
 * `unauthenticated`: logout, any API 401 (`clearSession` listener) and a
 * `GET /me` refetch that answers 401. A session that was valid before and then
 * disappears (not through logout) raises `isExpired` and the provider shows
 * the «نشست شما منقضی شد» dialog.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useLogout();

  // Set by `clearSession` (logout / 401); re-enabled by `signIn`
  const [ended, setEnded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Last user seen — tells "expired" apart from "never signed in"
  const [lastUser, setLastUser] = useState<CurrentUser | null>(null);

  const query = useQuery({
    ...authQueries.me(),
    enabled: !ended,
    refetchOnWindowFocus: true, // notice an expired session when the tab is back
  });

  const user = ended ? null : (query.data ?? null);
  const status: SessionStatus = ended
    ? "unauthenticated"
    : query.isPending
      ? "loading"
      : user
        ? "authenticated"
        : "unauthenticated";

  if (user && user !== lastUser) setLastUser(user);
  const isExpired =
    status === "unauthenticated" && lastUser !== null && !isLoggingOut;

  useEffect(() => onSessionCleared(() => setEnded(true)), []);
  // Claiming 401s keeps the API client from hard-redirecting; the dialog explains
  useEffect(() => onSessionExpired(() => undefined), []);

  const signIn = useCallback(
    (next: CurrentUser) => {
      queryClient.setQueryData(authKeys.me(), next);
      setEnded(false);
      setLastUser(next);
    },
    [queryClient],
  );

  const { mutateAsync: requestLogout } = logout;
  const signOut = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const loginPath = user ? loginPathForRole(user.role) : STUDENT_LOGIN_PATH;
    try {
      await requestLogout();
    } catch {
      // The server may already consider the session gone — sign out locally anyway
    }
    clearSession(); // adapter + mock_session cookie + query cache
    toast.success("با موفقیت خارج شدید");
    router.replace(loginPath);
  }, [isLoggingOut, requestLogout, router, user]);

  const value = useMemo<SessionState>(
    () => ({
      status,
      user,
      role: user?.role ?? null,
      isExpired,
      isLoggingOut,
      signIn,
      signOut,
    }),
    [status, user, isExpired, isLoggingOut, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
      <SessionExpiredDialog open={isExpired} />
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used inside <AuthProvider>");
  }
  return value;
}
