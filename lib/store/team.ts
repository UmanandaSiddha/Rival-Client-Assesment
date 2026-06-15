import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { Team } from '@/lib/types';

interface TeamState {
    teams: Team[];
    currentTeamId: string | null;
    loading: boolean;
    fetchTeams: () => Promise<void>;
    setCurrentTeam: (id: string) => void;
}

export const useTeams = create<TeamState>()(
    persist(
        (set, get) => ({
            teams: [],
            currentTeamId: null,
            loading: false,
            fetchTeams: async () => {
                set({ loading: true });
                try {
                    const teams = await api.get<Team[]>('/teams');
                    const current = get().currentTeamId;
                    const stillValid =
                        current && teams.some((t) => t.id === current);
                    set({
                        teams,
                        currentTeamId: stillValid
                            ? current
                            : (teams[0]?.id ?? null),
                        loading: false,
                    });
                } catch {
                    set({ loading: false });
                }
            },
            setCurrentTeam: (id) => set({ currentTeamId: id }),
        }),
        {
            name: 'teams',
            partialize: (s) => ({ currentTeamId: s.currentTeamId }),
        },
    ),
);

/** Convenience selector for the active team object. */
export function useCurrentTeam(): Team | undefined {
    return useTeams((s) => s.teams.find((t) => t.id === s.currentTeamId));
}
