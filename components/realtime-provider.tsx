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
 * EventSource reconnects on its own; we just re-open when the active team changes.
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

        const source = new EventSource(
            `${API_URL}/realtime/teams/${teamId}/stream`,
            { withCredentials: true },
        );

        source.onmessage = (e) => {
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

        return () => source.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamId]);

    return null;
}
