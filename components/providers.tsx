'use client';

import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/lib/store/auth';

export function Providers({ children }: { children: React.ReactNode }) {
    const fetchMe = useAuth((s) => s.fetchMe);

    // Rehydrate the session on first load (httpOnly cookies → ask the API who we are).
    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    return (
        <>
            {children}
            <Toaster richColors position="top-right" />
        </>
    );
}
