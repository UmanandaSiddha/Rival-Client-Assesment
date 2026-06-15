// Helpers for the post-auth "?next=" redirect (e.g. returning to an invite link after sign-in).
import { useEffect, useState } from 'react';

export function safeNext(value: string | null | undefined, fallback = '/tasks'): string {
    // Only allow internal absolute paths — never an external/protocol-relative URL.
    if (value && value.startsWith('/') && !value.startsWith('//')) return value;
    return fallback;
}

/** Read & sanitize the `next` query param from the current URL (client-side only). */
export function getNextParam(fallback = '/tasks'): string {
    if (typeof window === 'undefined') return fallback;
    return safeNext(new URLSearchParams(window.location.search).get('next'), fallback);
}

/**
 * Returns the `?next=…` query suffix to append to links so the redirect target persists in the URL
 * as the user moves between auth pages. Empty string when there's no valid `next`. Resolved after
 * mount to avoid a hydration mismatch.
 */
export function useNextSuffix(): string {
    const [suffix, setSuffix] = useState('');
    useEffect(() => {
        const next = safeNext(
            new URLSearchParams(window.location.search).get('next'),
            '',
        );
        setSuffix(next ? `?next=${encodeURIComponent(next)}` : '');
    }, []);
    return suffix;
}
