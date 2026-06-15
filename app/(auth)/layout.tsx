'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store/auth';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const status = useAuth((s) => s.status);
    const user = useAuth((s) => s.user);

    // Already signed in and verified → no reason to be on an auth page.
    useEffect(() => {
        if (status === 'authenticated' && user?.isVerified) {
            router.replace('/tasks');
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
