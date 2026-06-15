'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircleNotch } from '@phosphor-icons/react';
import { useAuth } from '@/lib/store/auth';
import { AppShell } from '@/components/app-shell/app-shell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const status = useAuth((s) => s.status);
    const user = useAuth((s) => s.user);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login');
        } else if (status === 'authenticated' && user && !user.isVerified) {
            router.replace('/verify');
        }
    }, [status, user, router]);

    if (status !== 'authenticated' || !user?.isVerified) {
        return (
            <div className="flex min-h-dvh items-center justify-center">
                <CircleNotch className="size-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <AppShell>{children}</AppShell>;
}
