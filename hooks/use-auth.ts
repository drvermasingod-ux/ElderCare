import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as FirebaseAuth from "@/lib/firebase-auth";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = { autoFetch?: boolean };

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const fetchUser = useCallback(async (): Promise<Auth.User | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await Api.getMe();
      setNeedsProfile(Boolean(result.needsProfile));
      setNeedsEmailVerification(Boolean(result.needsEmailVerification));
      setSessionEmail(result.email ?? null);
      if (result.error) setError(new Error(result.error));
      if (!result.user) {
        setUser(null);
        await Auth.clearUserInfo();
        return null;
      }
      const verifiedUser: Auth.User = {
        id: result.user.id,
        openId: result.user.openId,
        name: result.user.name,
        email: result.user.email,
        loginMethod: result.user.loginMethod,
        role: result.user.role ?? null,
        lastSignedIn: new Date(result.user.lastSignedIn),
        authProvider: "firebase",
      };
      setUser(verifiedUser);
      await Auth.setUserInfo(verifiedUser);
      setNeedsProfile(false);
      setNeedsEmailVerification(false);
      return verifiedUser;
    } catch (err) {
      setUser(null);
      await Auth.clearUserInfo();
      setError(err instanceof Error ? err : new Error("Could not verify the current account."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await FirebaseAuth.signOut();
    } catch {
      // Clear local session state even if the native SDK reports an error.
    } finally {
      await Auth.clearUserInfo();
      setUser(null);
      setError(null);
      setNeedsProfile(false);
      setNeedsEmailVerification(false);
      setSessionEmail(null);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) {
      setLoading(false);
      return;
    }
    if (!FirebaseAuth.isNativeAuthConfigured()) {
      void fetchUser();
      return;
    }

    let initialEventReceived = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = FirebaseAuth.onAuthStateChanged(() => {
      initialEventReceived = true;
      if (timeout) clearTimeout(timeout);
      void fetchUser();
    });
    timeout = setTimeout(() => {
      if (!initialEventReceived) void fetchUser();
    }, 8000);
    return () => {
      if (timeout) clearTimeout(timeout);
      unsubscribe();
    };
  }, [autoFetch, fetchUser]);

  return {
    user,
    loading,
    error,
    needsProfile,
    needsEmailVerification,
    sessionEmail,
    authConfigured: FirebaseAuth.isNativeAuthConfigured(),
    isAuthenticated: useMemo(() => Boolean(user), [user]),
    refresh: fetchUser,
    logout,
  };
}
