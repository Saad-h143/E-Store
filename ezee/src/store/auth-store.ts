import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      login: async (email: string, password: string) => {
        const supabase = createClient();
        set({ loading: true });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          set({ loading: false });
          return { success: false, error: error.message };
        }

        if (data.user) {
          // Fetch profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name: profile?.name || email.split("@")[0],
            phone: profile?.phone || "",
            role: (profile?.role as "admin" | "customer") || "customer",
            avatar: profile?.avatar_url || "",
            createdAt: data.user.created_at || new Date().toISOString(),
          };

          set({ user: userProfile, isAuthenticated: true, loading: false });
          return { success: true };
        }

        set({ loading: false });
        return { success: false, error: "Login failed" };
      },

      loginWithGoogle: async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      },

      register: async (name: string, email: string, password: string) => {
        const supabase = createClient();
        set({ loading: true });

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role: "customer" },
          },
        });

        if (error) {
          set({ loading: false });
          return { success: false, error: error.message };
        }

        if (data.user) {
          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            name,
            role: "customer",
            createdAt: data.user.created_at || new Date().toISOString(),
          };

          set({ user: userProfile, isAuthenticated: true, loading: false });
          return { success: true };
        }

        set({ loading: false });
        return { success: false, error: "Registration failed" };
      },

      logout: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          set({
            user: {
              id: user.id,
              email: user.email || "",
              name: profile?.name || user.email?.split("@")[0] || "",
              phone: profile?.phone || "",
              role: (profile?.role as "admin" | "customer") || "customer",
              avatar: profile?.avatar_url || "",
              createdAt: user.created_at || new Date().toISOString(),
            },
            isAuthenticated: true,
          });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: "ezee-auth",
    }
  )
);
