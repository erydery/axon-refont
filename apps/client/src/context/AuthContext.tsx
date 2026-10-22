import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { api, setAccessTokenProvider } from '../services/http';
import type { User } from '../types';
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const clerk = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!clerk.isLoaded) return;
    if (!clerk.isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const result = await api<{ user: User }>('/auth/me');
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [clerk.isLoaded, clerk.isSignedIn]);
  useEffect(() => {
    if (!clerk.isLoaded) return;
    setAccessTokenProvider(clerk.isSignedIn ? () => clerk.getToken() : null);
    setLoading(true);
    void refresh();
  }, [clerk.isLoaded, clerk.isSignedIn, clerk.getToken, refresh]);
  const signOut = async () => {
    await clerk.signOut();
    setUser(null);
  };
  const value = useMemo(
    () => ({ user, loading, refresh, signOut, setUser }),
    [user, loading, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
