'use client';

import { useEffect, useState } from 'react';
import { List } from '@phosphor-icons/react';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { RealtimeProvider } from '@/components/realtime-provider';
import { useTeams } from '@/lib/store/team';
import { TeamSwitcher } from './team-switcher';
import { Nav } from './nav';
import { UserMenu } from './user-menu';
import { PresenceIndicator } from './presence-indicator';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <div className="flex h-full flex-col gap-4 p-4">
            <div className="px-1 font-heading text-lg font-semibold tracking-tight">
                Rival Tasks
            </div>
            <TeamSwitcher />
            <Nav onNavigate={onNavigate} />
        </div>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    const fetchTeams = useTeams((s) => s.fetchTeams);
    const currentTeamId = useTeams((s) => s.currentTeamId);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    return (
        <div className="flex min-h-dvh">
            <aside className="hidden w-60 shrink-0 border-r md:block">
                <div className="sticky top-0 h-dvh">
                    <SidebarContent />
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-14 items-center gap-2 border-b px-4">
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                aria-label="Open menu"
                            >
                                <List />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <SheetTitle className="sr-only">Navigation</SheetTitle>
                            <SidebarContent
                                onNavigate={() => setMobileOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>

                    <div className="flex-1" />
                    <PresenceIndicator />
                    <ThemeToggle />
                    <UserMenu />
                </header>

                <main className="min-w-0 flex-1">{children}</main>
            </div>

            <RealtimeProvider teamId={currentTeamId} />
        </div>
    );
}
