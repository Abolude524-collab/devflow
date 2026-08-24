import { create } from 'zustand';
import type { AuthResponse, RegisterResponse, Workspace } from './api';

export interface AuthState {
  token: string | null;
  user: RegisterResponse['user'] | null;
  setSession: (session: AuthResponse) => void;
  setUser: (user: RegisterResponse['user']) => void;
  clearSession: () => void;
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('devflow_token'),
  user: null,
  activeWorkspace: null,
  setSession: ({ token, user }) => {
    localStorage.setItem('devflow_token', token);
    set({ token, user });
  },
  setUser: (user) => set({ user }),
  clearSession: () => {
    localStorage.removeItem('devflow_token');
    set({ token: null, user: null, activeWorkspace: null });
  },
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
}));
