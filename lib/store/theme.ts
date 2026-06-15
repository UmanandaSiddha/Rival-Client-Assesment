import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
    theme: Theme;
    toggle: () => void;
    setTheme: (theme: Theme) => void;
}

function apply(theme: Theme) {
    if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }
}

export const useTheme = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'light',
            toggle: () => {
                const next = get().theme === 'dark' ? 'light' : 'dark';
                apply(next);
                set({ theme: next });
            },
            setTheme: (theme) => {
                apply(theme);
                set({ theme });
            },
        }),
        {
            name: 'theme',
            onRehydrateStorage: () => (state) => state && apply(state.theme),
        },
    ),
);
