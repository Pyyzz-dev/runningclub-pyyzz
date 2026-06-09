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
import { fetchCurrentUser } from "@/app/actions/dataActions";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/supabase/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<User | null>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data } = await fetchCurrentUser();
    setUser(data ?? null);
    return data ?? null;
  }, []);

  useEffect(() => {
    setUser(initialUser ?? null);
  }, [initialUser]);

  useEffect(() => {
    let mounted = true;

    async function syncSession() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (authUser) {
        await refreshUser();
      } else {
        setUser(null);
      }

      setIsLoading(false);
    }

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        router.refresh();
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        await refreshUser();
        router.refresh();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, refreshUser, router]);

  const value = useMemo(
    () => ({ user, isLoading, refreshUser, setUser }),
    [user, isLoading, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
}
