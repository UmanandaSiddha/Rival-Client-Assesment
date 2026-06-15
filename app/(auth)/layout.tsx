'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store/auth';
import { getNextParam } from '@/lib/redirect';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const status = useAuth((s) => s.status);
    const user = useAuth((s) => s.user);

    // Already signed in and verified → go where we were headed (or the app).
    useEffect(() => {
        if (status === 'authenticated' && user?.isVerified) {
            router.replace(getNextParam());
        }
    }, [status, user, router]);

    return (
        <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-sm">
                <div className="mb-6 text-center">
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        Rival Tasks
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Team task management, in real time.
                    </p>
                </div>
                {children}
            </div>
        </main>
    );
}
