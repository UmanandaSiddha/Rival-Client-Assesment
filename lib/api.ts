// Thin fetch wrapper around the backend. Cookies are httpOnly and set by the API, so every request
// uses `credentials: 'include'`. On a 401 it tries the refresh-token endpoint once, then retries.

export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// The server's origin (no /api/v1) — uploaded files are served from /uploads/** there.
const API_ORIGIN = API_URL.replace(/\/api\/v\d+\/?$/, '');

// Resolve a stored attachment/preview URL: absolute links pass through; server-relative
// paths (e.g. /uploads/...) get the API origin prepended.
export function assetUrl(path?: string | null): string {
    if (!path) return '';
    return /^https?:\/\//i.test(path) ? path : `${API_ORIGIN}${path}`;
}

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

interface RequestOptions {
    method?: string;
    body?: unknown;
    // multipart/form-data body (skips JSON serialization + content-type)
    form?: FormData;
    // skip the auto refresh-on-401 retry (used by the refresh call itself)
    noRetry?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, form, noRetry } = options;

    const res = await fetch(`${API_URL}${path}`, {
        method,
        credentials: 'include',
        headers: form ? undefined : body ? { 'Content-Type': 'application/json' } : undefined,
        body: form ? form : body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !noRetry && path !== '/auth/refresh-token') {
        const refreshed = await tryRefresh();
        if (refreshed) return request<T>(path, { ...options, noRetry: true });
    }

    if (!res.ok) {
        throw new ApiError(res.status, await extractError(res));
    }

    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function tryRefresh(): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/auth/refresh-token`, {
            method: 'GET',
            credentials: 'include',
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function extractError(res: Response): Promise<string> {
    try {
        const data = await res.json();
        const err = data?.error ?? data?.message ?? data;
        if (typeof err === 'string') return err;
        if (Array.isArray(err?.message)) return err.message.join(', ');
        if (err?.message) return err.message;
        return JSON.stringify(err);
    } catch {
        return res.statusText || 'Request failed';
    }
}

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
    upload: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', form }),
};
