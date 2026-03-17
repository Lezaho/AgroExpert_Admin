import { create } from "zustand";
import { auth } from "../firebase/firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  getIdTokenResult,
} from "firebase/auth";
import type { User } from "firebase/auth";

export type Role = "user" | "staff" | "admin";

type AuthState = {
  user: User | null;
  role: Role | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

let _listenerAttached = false;

export const useAuth = create<AuthState>((set) => {
  // Attacher l'écouteur AU PLUS UNE FOIS
  if (!_listenerAttached) {
    onAuthStateChanged(auth, async (u) => {
      if (!u) {
        set({ user: null, role: null, loading: false, error: null });
        return;
      }
      try {
        const token = await getIdTokenResult(u, true); // force refresh pour récupérer les custom claims
        const role = (token.claims["role"] as Role) ?? "user";
        set({ user: u, role, loading: false, error: null });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur d'authentification";
        set({ user: u, role: null, loading: false, error: msg });
      }
    });
    _listenerAttached = true;
  }

  return {
    user: null,
    role: null,
    loading: true,
    error: null,

    login: async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged fera le reste
    },

    logout: async () => {
      await signOut(auth);
    },

    resetPassword: async (email: string) => {
      // Optionnel : envoyer un email de reset avec sendPasswordResetEmail si nécessaire
      // import { sendPasswordResetEmail } from "firebase/auth";
      // await sendPasswordResetEmail(auth, email);
      return;
    },
  };
});