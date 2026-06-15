'use client';

import { usePresence } from '@/lib/store/presence';

export function PresenceIndicator() {
    const count = usePresence((s) => s.online.length);
    if (count === 0) return null;

    return (
        <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            {count} online
        </span>
    );
}
