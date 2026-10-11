"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/shared/libs/supabase";
import type { Membership, MemberRole } from "../auth.definitions";

interface AuthState {
  session: Session | null;
  /** The signed-in person's school. null = signed in but not school staff. */
  membership: Membership | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  membership: null,
  loading: true,
  signIn: async () => ({ ok: false }),
  logout: async () => {},
});

async function loadMembership(userId: string): Promise<Membership | null> {
  // RLS only returns rows for schools this user belongs to.
  const { data, error } = await supabase
    .from("school_members")
    .select("school_id, role, full_name, schools(name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const school = data.schools as { name: string } | { name: string }[] | null;
  const schoolName = Array.isArray(school) ? school[0]?.name : school?.name;
  return {
    schoolId: data.school_id,
    schoolName: schoolName ?? "",
    role: data.role as MemberRole,
    fullName: data.full_name,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const apply = async (s: Session | null) => {
      const m = s ? await loadMembership(s.user.id) : null;
      if (!active) return;
      setSession(s);
      setMembership(m);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer: Supabase forbids awaiting other Supabase calls inside this callback.
      setTimeout(() => apply(s), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return { ok: false, message: "Incorrect email or password." };
    }
    const m = await loadMembership(data.session.user.id);
    if (!m) {
      // A valid account that isn't school staff gets no session here.
      await supabase.auth.signOut();
      return { ok: false, message: "This portal is for partner school staff only." };
    }
    setSession(data.session);
    setMembership(m);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setSession(null);
    setMembership(null);
    router.replace("/sign-in");
  }, [queryClient, router]);

  return (
    <AuthContext.Provider value={{ session, membership, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
