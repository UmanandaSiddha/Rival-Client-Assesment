'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CircleNotch } from '@phosphor-icons/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/store/auth';
import { useTeams } from '@/lib/store/team';
import { fullName } from '@/lib/task-ui';
import type { Team } from '@/lib/types';

interface InvitePreview {
    email: string;
    status: string;
    teamName: string;
    invitedByFirstName?: string;
    invitedByLastName?: string;
}

export default function InvitePage() {
    const token = useParams().token as string;
    const router = useRouter();
    const status = useAuth((s) => s.status);
    const user = useAuth((s) => s.user);
    const fetchTeams = useTeams((s) => s.fetchTeams);
    const setCurrentTeam = useTeams((s) => s.setCurrentTeam);

    const [invite, setInvite] = useState<InvitePreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);

    useEffect(() => {
        api.get<InvitePreview>(`/invites/${token}`)
            .then(setInvite)
            .catch(() => setInvite(null))
            .finally(() => setLoading(false));
    }, [token]);

    async function respond(action: 'accept' | 'decline') {
        setWorking(true);
        try {
            if (action === 'accept') {
                const team = await api.post<Team>(`/invites/${token}/accept`);
                await fetchTeams();
                setCurrentTeam(team.id);
                toast.success(`Joined ${invite?.teamName ?? 'the team'}`);
                router.replace('/tasks');
            } else {
                await api.post(`/invites/${token}/decline`);
                toast.success('Invite declined');
                router.replace('/tasks');
            }
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Action failed');
        } finally {
            setWorking(false);
        }
    }

    const inviter = fullName(
        invite?.invitedByFirstName,
        invite?.invitedByLastName,
        'Someone',
    );

    return (
        <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
            <Card className="w-full max-w-sm">
                {loading ? (
                    <CardContent className="flex justify-center py-12">
                        <CircleNotch className="size-6 animate-spin text-muted-foreground" />
                    </CardContent>
                ) : !invite ? (
                    <>
                        <CardHeader>
                            <CardTitle>Invite not found</CardTitle>
                            <CardDescription>
                                This invitation is invalid or has expired.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/tasks">Go to app</Link>
                            </Button>
                        </CardFooter>
                    </>
                ) : invite.status !== 'PENDING' ? (
                    <>
                        <CardHeader>
                            <CardTitle>Invite unavailable</CardTitle>
                            <CardDescription>
                                This invite is {invite.status.toLowerCase()}.
                            </CardDescription>
                        </CardHeader>
                    </>
                ) : (
                    <>
                        <CardHeader>
                            <CardTitle>Join {invite.teamName}</CardTitle>
                            <CardDescription>
                                {inviter} invited <b>{invite.email}</b> to collaborate.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex-col gap-3">
                            {status === 'authenticated' && user ? (
                                <>
                                    <Button
                                        className="w-full"
                                        disabled={working}
                                        onClick={() => respond('accept')}
                                    >
                                        {working && (
                                            <CircleNotch className="animate-spin" />
                                        )}
                                        Accept invite
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full"
                                        disabled={working}
                                        onClick={() => respond('decline')}
                                    >
                                        Decline
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <p className="text-center text-sm text-muted-foreground">
                                        Sign in as {invite.email} to accept.
                                    </p>
                                    <Button asChild className="w-full">
                                        <Link href="/login">Sign in</Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Link href="/signup">Create account</Link>
                                    </Button>
                                </>
                            )}
                        </CardFooter>
                    </>
                )}
            </Card>
        </main>
    );
}
