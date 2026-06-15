'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    ArrowSquareOut,
    CircleNotch,
    File as FileIcon,
    Image as ImageIcon,
    LinkSimple,
    Trash,
    UploadSimple,
} from '@phosphor-icons/react';
import { api, ApiError, assetUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '@/lib/store/tasks';
import type { TaskAttachment } from '@/lib/types';

function formatSize(bytes?: number | null): string {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const isImage = (a: TaskAttachment) =>
    a.type === 'FILE' && (a.mimeType ?? '').startsWith('image/');

interface Props {
    taskId: string;
    open: boolean;
    readOnly?: boolean;
}

export function TaskAttachments({ taskId, open, readOnly }: Props) {
    const [items, setItems] = useState<TaskAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [addingLink, setAddingLink] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const setAttachmentSummary = useTasks((s) => s.setAttachmentSummary);

    // Keep the card's thumbnails/count in sync with the authoritative list.
    const pushSummary = useCallback(
        (list: TaskAttachment[]) => {
            const previews = list
                .map((a) => a.previewUrl)
                .filter((u): u is string => Boolean(u))
                .slice(0, 3);
            setAttachmentSummary(taskId, list.length, previews);
        },
        [setAttachmentSummary, taskId],
    );

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        api.get<TaskAttachment[]>(`/tasks/${taskId}/attachments`)
            .then((list) => {
                setItems(list);
                pushSummary(list);
            })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [taskId, open, pushSummary]);

    async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-picking the same file
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const added = await api.upload<TaskAttachment>(
                `/tasks/${taskId}/attachments/file`,
                form,
            );
            const next = [added, ...items];
            setItems(next);
            pushSummary(next);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    async function onAddLink(e: React.FormEvent) {
        e.preventDefault();
        const url = linkUrl.trim();
        if (!url) return;
        setAddingLink(true);
        try {
            const added = await api.post<TaskAttachment>(
                `/tasks/${taskId}/attachments/link`,
                { url },
            );
            const next = [added, ...items];
            setItems(next);
            pushSummary(next);
            setLinkUrl('');
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Could not add link');
        } finally {
            setAddingLink(false);
        }
    }

    async function onRemove(id: string) {
        const prev = items;
        const next = items.filter((a) => a.id !== id);
        setItems(next); // optimistic
        pushSummary(next);
        try {
            await api.delete(`/tasks/${taskId}/attachments/${id}`);
        } catch (err) {
            setItems(prev); // rollback
            pushSummary(prev);
            toast.error(err instanceof ApiError ? err.message : 'Delete failed');
        }
    }

    return (
        <div className="space-y-4">
            {!readOnly && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInput}
                            type="file"
                            className="hidden"
                            onChange={onPickFile}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => fileInput.current?.click()}
                        >
                            {uploading ? (
                                <CircleNotch className="animate-spin" />
                            ) : (
                                <UploadSimple />
                            )}
                            Upload file
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            up to 10&nbsp;MB
                        </span>
                    </div>
                    <form onSubmit={onAddLink} className="flex items-center gap-2">
                        <Input
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="Paste a link (https://…)"
                            type="url"
                        />
                        <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            disabled={addingLink || !linkUrl.trim()}
                        >
                            {addingLink ? (
                                <CircleNotch className="animate-spin" />
                            ) : (
                                <LinkSimple />
                            )}
                            Add
                        </Button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    No attachments yet.
                </p>
            ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {items.map((a) => (
                        <li
                            key={a.id}
                            className="group flex items-center gap-3 rounded-md border p-2"
                        >
                            <a
                                href={assetUrl(a.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex min-w-0 flex-1 items-center gap-3"
                            >
                                <Preview attachment={a} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {a.name}
                                    </p>
                                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                        {a.type === 'LINK' ? (
                                            <>
                                                <ArrowSquareOut className="size-3 shrink-0" />
                                                {a.url}
                                            </>
                                        ) : (
                                            [a.mimeType, formatSize(a.sizeBytes)]
                                                .filter(Boolean)
                                                .join(' · ')
                                        )}
                                    </p>
                                </div>
                            </a>
                            {!readOnly && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={() => onRemove(a.id)}
                                    aria-label="Remove attachment"
                                >
                                    <Trash />
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function Preview({ attachment: a }: { attachment: TaskAttachment }) {
    const thumb = assetUrl(a.previewUrl);
    if (thumb) {
        return (
            // Plain <img>: attachments are arbitrary user/remote URLs, not next/image-optimizable.
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={thumb}
                alt={a.name}
                className="size-10 shrink-0 rounded object-cover"
            />
        );
    }
    return (
        <span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
            {a.type === 'LINK' ? (
                <LinkSimple className="size-5" />
            ) : isImage(a) ? (
                <ImageIcon className="size-5" />
            ) : (
                <FileIcon className="size-5" />
            )}
        </span>
    );
}
