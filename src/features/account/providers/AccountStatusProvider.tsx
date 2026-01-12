import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { accountApi } from "../api/accountApi";
import { normalizeApiError } from "@api/normalizeApiError";
import { AccountStatusContext } from "../contexts/accountStatusContext";
import { useAuth } from "@features/auth/hooks/useAuth";

export const AccountStatusProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user, isReady, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [emailVerifiedAt, setEmailVerifiedAt] = useState<string | null>(null);
  const isMounted = useRef(true);

  const isAuthed = Boolean(isReady && user);

  const refresh = useCallback(async () => {
    if (!isAuthed) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await accountApi.getSecurity();
      if (isMounted.current) {
        const verified = Boolean(data.emailVerified);
        const verifiedAt = data.emailVerifiedAt ?? null;
        setEmailVerified(verified);
        setEmailVerifiedAt(verifiedAt);
        updateUser((current) => ({
          ...current,
          email_verified: verified,
          email_verified_at: verifiedAt,
        }));
      }
    } catch (err) {
      if (isMounted.current) {
        setError(normalizeApiError(err).message);
        setEmailVerified(null);
        setEmailVerifiedAt(null);
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [isAuthed, updateUser]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      setIsLoading(false);
      setError(null);
      setEmailVerified(null);
      setEmailVerifiedAt(null);
      return;
    }
    void refresh();
  }, [isAuthed, refresh]);

  const value = useMemo(
    () => ({ isLoading, error, emailVerified, emailVerifiedAt, refresh }),
    [isLoading, error, emailVerified, emailVerifiedAt, refresh],
  );

  return (
    <AccountStatusContext.Provider value={value}>
      {children}
    </AccountStatusContext.Provider>
  );
};
