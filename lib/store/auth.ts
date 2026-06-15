import { create } from 'zustand';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
    user: User | null;
    status: AuthStatus;
    setUser: (user: User | null) => void;
    fetchMe: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    status: 'loading',
    setUser: (user) =>
        set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
    fetchMe: async () => {
        try {
            const res = await api.get<{ data: User }>('/auth/me');
            set({ user: res.data, status: 'authenticated' });
        } catch {
            set({ user: null, status: 'unauthenticated' });
        }
    },
    logout: async () => {
        try {
            await api.put('/auth/logout');
        } catch {
            // ignore — clear local state regardless
        }
        set({ user: null, status: 'unauthenticated' });
    },
}));
