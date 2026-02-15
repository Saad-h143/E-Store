import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile } from "@/types";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loginAsAdmin: () => void;
}

const mockAdmin: UserProfile = {
  id: "admin-1",
  email: "admin@ezee.com",
  name: "Ezee Admin",
  phone: "+91 99999 00000",
  role: "admin",
  createdAt: "2024-01-01T00:00:00Z",
};

const mockCustomer: UserProfile = {
  id: "user-1",
  email: "customer@ezee.com",
  name: "Rahul Sharma",
  phone: "+91 98765 43210",
  role: "customer",
  createdAt: "2024-06-15T00:00:00Z",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, _password: string) => {
        // Mock login - simulate network delay
        await new Promise((r) => setTimeout(r, 800));

        if (email === "admin@ezee.com") {
          set({ user: mockAdmin, isAuthenticated: true });
          return true;
        }

        // Any other email logs in as customer
        set({
          user: { ...mockCustomer, email, name: email.split("@")[0] },
          isAuthenticated: true,
        });
        return true;
      },

      register: async (name: string, email: string, _password: string) => {
        await new Promise((r) => setTimeout(r, 800));
        set({
          user: {
            id: `user-${Date.now()}`,
            email,
            name,
            role: "customer",
            createdAt: new Date().toISOString(),
          },
          isAuthenticated: true,
        });
        return true;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      loginAsAdmin: () => {
        set({ user: mockAdmin, isAuthenticated: true });
      },
    }),
    {
      name: "ezee-auth",
    }
  )
);
