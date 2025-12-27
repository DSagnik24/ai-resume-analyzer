export const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';

const ACCESS_KEY = 'access_token';

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
}

export function setAccessToken(token: string | null) {
    if (token) localStorage.setItem(ACCESS_KEY, token);
    else localStorage.removeItem(ACCESS_KEY);
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(opts.headers as Record<string,string> || {}),
    };
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_BASE + path, { ...opts, headers, credentials: 'include' });
    if (res.status === 401 && path !== '/auth/refresh') {
        // try refresh
        const ok = await refresh();
        if (ok) {
            const token2 = getAccessToken();
            if (token2) headers['Authorization'] = `Bearer ${token2}`;
            return fetch(API_BASE + path, { ...opts, headers, credentials: 'include' });
        }
    }
    return res;
}

export async function login(email: string, password: string) {
    const res = await fetch(API_BASE + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Login failed');
    }
    const body = await res.json();
    setAccessToken(body.accessToken);
    return body;
}

export async function register(email: string, password: string, name?: string) {
    const res = await fetch(API_BASE + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include'
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Register failed');
    }
    return res.json();
}

export async function refresh() {
    try {
        const res = await fetch(API_BASE + '/auth/refresh', { method: 'POST', credentials: 'include' });
        if (!res.ok) return false;
        const body = await res.json();
        setAccessToken(body.accessToken);
        return true;
    } catch (e) {
        return false;
    }
}

export async function logout() {
    await fetch(API_BASE + '/auth/logout', { method: 'POST', credentials: 'include' });
    setAccessToken(null);
}

export async function me() {
    const res = await apiFetch('/auth/me');
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
}
