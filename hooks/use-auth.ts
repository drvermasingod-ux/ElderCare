import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = { autoFetch?: boolean };

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUser = await Api.getMe();
      if (!apiUser) {
        setUser(null);
        await Auth.clearUserInfo();
        return;
      }
      const verifiedUser: Auth.User = {
        id: apiUser.id,
        openId: apiUser.openId,
        name: apiUser.name,
        email: apiUser.email,
        loginMethod: apiUser.loginMethod,
        role: apiUser.role ?? null,
        lastSignedIn: new Date(apiUser.lastSignedIn),
      };
      setUser(verifiedUser);
      await Auth.setUserInfo(verifiedUser);
    } catch (err) {
      setUser(null);
      await Auth.clearUserInfo();
      setError(err instanceof Error ? err : new Error("Could not verify the current account."));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } catch {
      // Clear local credentials even if the service cannot be reached.
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) void fetchUser();
    else setLoading(false);
  }, [autoFetch, fetchUser]);

  return { user, loading, error, isAuthenticated: useMemo(() => Boolean(user), [user]), refresh: fetchUser, logout };
}
