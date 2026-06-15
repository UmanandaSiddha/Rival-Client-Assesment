'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useTeams } from '@/lib/store/team';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTeamDialog } from '@/components/team/create-team-dialog';
import { MembersTab } from '@/components/team/members-tab';
import { InvitesTab } from '@/components/team/invites-tab';
import type { Invite, Role, TeamDetail, TeamMember } from '@/lib/types';

export default function TeamPage() {
    const currentTeamId = useTeams((s) => s.currentTeamId);
    const [detail, setDetail] = useState<TeamDetail | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);

    const load = useCallback(async () => {
        if (!currentTeamId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [d, m, r] = await Promise.all([
                api.get<TeamDetail>(`/teams/${currentTeamId}`),
                api.get<TeamMember[]>(`/teams/${currentTeamId}/members`),
                api.get<Role[]>(`/teams/${currentTeamId}/roles`),
            ]);
            setDetail(d);
            setMembers(m);
            setRoles(r);

            const canInvite =
                d.access?.hasAll || d.access?.permissions.includes('MEMBER_INVITE');
            if (canInvite) {
                try {
                    setInvites(
                        await api.get<Invite[]>(`/teams/${currentTeamId}/invites`),
                    );
                } catch {
                    setInvites([]);
                }
            } else {
                setInvites([]);
            }
        } finally {
            setLoading(false);
        }
    }, [currentTeamId]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-5 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="font-heading text-xl font-semibold tracking-tight">
                        {detail?.name ?? 'Team'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {members.length} member{members.length === 1 ? '' : 's'}
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                    <Plus weight="bold" /> New team
                </Button>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))}
                </div>
            ) : !currentTeamId ? (
                <p className="text-sm text-muted-foreground">No team selected.</p>
            ) : (
                <Tabs defaultValue="members">
                    <TabsList>
                        <TabsTrigger value="members">Members</TabsTrigger>
                        <TabsTrigger value="invites">Invites</TabsTrigger>
                    </TabsList>
                    <TabsContent value="members" className="mt-4">
                        <MembersTab
                            teamId={currentTeamId}
                            members={members}
                            roles={roles}
                            access={detail?.access}
                            onChanged={load}
                        />
                    </TabsContent>
                    <TabsContent value="invites" className="mt-4">
                        <InvitesTab
                            teamId={currentTeamId}
                            invites={invites}
                            roles={roles}
                            access={detail?.access}
                            onChanged={load}
                        />
                    </TabsContent>
                </Tabs>
            )}

            <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}
