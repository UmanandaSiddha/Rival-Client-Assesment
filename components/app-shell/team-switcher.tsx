'use client';

import { CaretUpDown, Check, UsersThree } from '@phosphor-icons/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTeams } from '@/lib/store/team';

export function TeamSwitcher() {
    const teams = useTeams((s) => s.teams);
    const currentTeamId = useTeams((s) => s.currentTeamId);
    const setCurrentTeam = useTeams((s) => s.setCurrentTeam);
    const current = teams.find((t) => t.id === currentTeamId);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md border bg-card px-3 py-2 text-left text-sm hover:bg-accent/50">
                <UsersThree className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-medium">
                    {current?.name ?? 'Select team'}
                </span>
                <CaretUpDown className="size-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Your teams</DropdownMenuLabel>
                {teams.map((team) => (
                    <DropdownMenuItem
                        key={team.id}
                        onClick={() => setCurrentTeam(team.id)}
                        className="gap-2"
                    >
                        <span className="flex-1 truncate">{team.name}</span>
                        <Check
                            className={cn(
                                'size-4',
                                team.id === currentTeamId
                                    ? 'opacity-100'
                                    : 'opacity-0',
                            )}
                        />
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
