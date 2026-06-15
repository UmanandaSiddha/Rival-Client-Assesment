'use client';

import { useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { useTasks } from '@/lib/store/tasks';
import { usePresence } from '@/lib/store/presence';
import type { Task } from '@/lib/types';

interface RealtimeEvent {
    type: string;
    teamId: string;
    actorId?: string;
    payload?: {
        task?: Task;
        taskId?: string;
        onlineUserIds?: string[];
    };
}

/**
 * Opens the team's SSE stream and fans events into the task + presence stores.
 *
 * On error (e.g. the 15-min access token expired and the stream dropped) it refreshes the tokens
 * via /auth/refresh-token, then reconnects with exponential backoff — so the live feed resumes
 * on its own in any environment.
 */
export function RealtimeProvider({ teamId }: { teamId: string | null }) {
    const upsert = useTasks((s) => s.upsert);
    const removeLocal = useTasks((s) => s.removeLocal);
    const setSnapshot = usePresence((s) => s.setSnapshot);
    const addPresence = usePresence((s) => s.add);
    const removePresence = usePresence((s) => s.remove);
    const resetPresence = usePresence((s) => s.reset);

    useEffect(() => {
        if (!teamId) return;
        resetPresence();

        let closed = false;
        let retry = 0;
        let timer: ReturnType<typeof setTimeout>;
        let source: EventSource | null = null;

        const handle = (e: MessageEvent) => {
            let evt: RealtimeEvent;
            try {
                evt = JSON.parse(e.data);
            } catch {
                return;
            }
            switch (evt.type) {
                case 'task.created':
                case 'task.updated':
                    if (evt.payload?.task) upsert(evt.payload.task);
                    break;
                case 'task.deleted':
                    if (evt.payload?.taskId) removeLocal(evt.payload.taskId);
                    break;
                case 'presence.snapshot':
                    setSnapshot(evt.payload?.onlineUserIds ?? []);
                    break;
                case 'presence.online':
                    if (evt.actorId) addPresence(evt.actorId);
                    break;
                case 'presence.offline':
                    if (evt.actorId) removePresence(evt.actorId);
                    break;
            }
        };

        const connect = () => {
            source = new EventSource(
                `${API_URL}/realtime/teams/${teamId}/stream`,
                { withCredentials: true },
            );
            source.onopen = () => {
                retry = 0;
            };
            source.onmessage = handle;
            source.onerror = async () => {
                source?.close();
                if (closed) return;
                // The token may have expired — refresh, then reconnect with backoff.
                await fetch(`${API_URL}/auth/refresh-token`, {
                    credentials: 'include',
                }).catch(() => undefined);
                const delay = Math.min(1000 * 2 ** retry, 15000);
                retry += 1;
                timer = setTimeout(() => {
                    if (!closed) connect();
                }, delay);
            };
        };

        connect();

        return () => {
            closed = true;
            clearTimeout(timer);
            source?.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamId]);

    return null;
}
