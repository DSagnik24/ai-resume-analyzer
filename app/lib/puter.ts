import { create } from "zustand";

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:9000";

interface PuterUser {
    id: string;
    username?: string;
    email?: string;
}

interface AuthResponse {
    user: PuterUser;
    accessToken: string;
    refreshToken: string;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string | { type: string; [key: string]: string }[];
}

interface PuterChatOptions {
    model?: string;
    [key: string]: unknown;
}

interface SimpleFSItem {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
}

interface KVItem {
    key: string;
    value: string;
}

interface AIMessage {
    role?: string;
    content?: string | ({ text?: string } & any)[] | any[];
    [key: string]: any;
}

interface AIResponse {
    message?: AIMessage;
    [key: string]: any;
}

interface PuterStore {
    isLoading: boolean;
    error: string | null;
    puterReady: boolean;
    auth: {
        user: PuterUser | null;
        isAuthenticated: boolean;
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
        refreshUser: () => Promise<void>;
        checkAuthStatus: () => Promise<boolean>;
        getUser: () => PuterUser | null;
    };
    fs: {
        write: (
            path: string,
            data: string | File | Blob
        ) => Promise<File | undefined>;
        read: (path: string) => Promise<Blob | undefined>;
        upload: (file: File[] | Blob[]) => Promise<SimpleFSItem | undefined>;
        delete: (path: string) => Promise<void>;
        readDir: (path: string) => Promise<SimpleFSItem[] | undefined>;
    };
    ai: {
        chat: (
            prompt: string | ChatMessage[],
            imageURL?: string | PuterChatOptions,
            testMode?: boolean,
            options?: PuterChatOptions
        ) => Promise<AIResponse | undefined>;
        feedback: (
            path: string,
            message: string
        ) => Promise<AIResponse | undefined>;
        img2txt: (
            image: string | File | Blob,
            testMode?: boolean
        ) => Promise<string | undefined>;
    };
    kv: {
        get: (key: string) => Promise<string | null | undefined>;
        set: (key: string, value: string) => Promise<boolean | undefined>;
        delete: (key: string) => Promise<boolean | undefined>;
        list: (
            pattern: string,
            returnValues?: boolean
        ) => Promise<string[] | KVItem[] | undefined>;
        flush: () => Promise<boolean | undefined>;
    };

    init: () => void;
    clearError: () => void;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
};

// Helper function to set auth token
const setAuthToken = (token: string, refreshToken?: string): void => {
    if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
        if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
        }
    }
};

// Helper function to clear auth token
const clearAuthToken = (): void => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
    }
};

// API request helper
const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
    });
};

export const usePuterStore = create<PuterStore>((set, get) => {
    const setError = (msg: string) => {
        set({
            error: msg,
            isLoading: false,
            auth: {
                user: null,
                isAuthenticated: false,
                signIn: get().auth.signIn,
                signOut: get().auth.signOut,
                refreshUser: get().auth.refreshUser,
                checkAuthStatus: get().auth.checkAuthStatus,
                getUser: get().auth.getUser,
            },
        });
    };

    const checkAuthStatus = async (): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
            const token = getAuthToken();
            if (!token) {
                set({
                    auth: {
                        user: null,
                        isAuthenticated: false,
                        signIn: get().auth.signIn,
                        signOut: get().auth.signOut,
                        refreshUser: get().auth.refreshUser,
                        checkAuthStatus: get().auth.checkAuthStatus,
                        getUser: () => null,
                    },
                    isLoading: false,
                });
                return false;
            }

            // Check for demo auth first
            const demoAuth = localStorage.getItem('demo_auth');
            if (demoAuth && token.startsWith('demo_token_')) {
                const user = JSON.parse(demoAuth) as PuterUser;
                set({
                    auth: {
                        user,
                        isAuthenticated: true,
                        signIn: get().auth.signIn,
                        signOut: get().auth.signOut,
                        refreshUser: get().auth.refreshUser,
                        checkAuthStatus: get().auth.checkAuthStatus,
                        getUser: () => user,
                    },
                    isLoading: false,
                });
                return true;
            }

            // Try API auth
            try {
                const response = await apiRequest("/api/auth/me");
                if (response.ok) {
                    const user: PuterUser = await response.json();
                    set({
                        auth: {
                            user,
                            isAuthenticated: true,
                            signIn: get().auth.signIn,
                            signOut: get().auth.signOut,
                            refreshUser: get().auth.refreshUser,
                            checkAuthStatus: get().auth.checkAuthStatus,
                            getUser: () => user,
                        },
                        isLoading: false,
                    });
                    return true;
                }
            } catch (apiErr) {
                console.warn('Auth API unavailable', apiErr);
            }

            clearAuthToken();
            set({
                auth: {
                    user: null,
                    isAuthenticated: false,
                    signIn: get().auth.signIn,
                    signOut: get().auth.signOut,
                    refreshUser: get().auth.refreshUser,
                    checkAuthStatus: get().auth.checkAuthStatus,
                    getUser: () => null,
                },
                isLoading: false,
            });
            return false;
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Failed to check auth status";
            setError(msg);
            return false;
        }
    };

    const signIn = async (): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
            const username = window.prompt("Enter username");
            if (username === null) {
                set({ isLoading: false });
                return;
            }
            const password = window.prompt("Enter password") || "resumind-demo";

            const response = await apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ username: username || "demo-user", password }),
            });

            if (!response.ok) {
                throw new Error("Sign in failed");
            }

            const body = (await response.json()) as AuthResponse;
            setAuthToken(body.accessToken, body.refreshToken);
            localStorage.removeItem("demo_auth");

            set({
                auth: {
                    user: body.user,
                    isAuthenticated: true,
                    signIn: get().auth.signIn,
                    signOut: get().auth.signOut,
                    refreshUser: get().auth.refreshUser,
                    checkAuthStatus: get().auth.checkAuthStatus,
                    getUser: () => body.user,
                },
                isLoading: false,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Sign in failed";
            setError(msg);
        }
    };

    const signOut = async (): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
            // Try API logout (may fail if no backend)
            try {
                await apiRequest("/api/auth/logout", {
                    method: "POST",
                });
            } catch (apiErr) {
                console.warn('Auth API unavailable for logout', apiErr);
            }

            clearAuthToken();
            localStorage.removeItem('demo_auth');
            
            set({
                auth: {
                    user: null,
                    isAuthenticated: false,
                    signIn: get().auth.signIn,
                    signOut: get().auth.signOut,
                    refreshUser: get().auth.refreshUser,
                    checkAuthStatus: get().auth.checkAuthStatus,
                    getUser: () => null,
                },
                isLoading: false,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Sign out failed";
            setError(msg);
        }
    };

    const refreshUser = async (): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
            // Check for demo auth first
            const demoAuth = localStorage.getItem('demo_auth');
            const token = getAuthToken();
            if (demoAuth && token?.startsWith('demo_token_')) {
                const user = JSON.parse(demoAuth) as PuterUser;
                set({
                    auth: {
                        user,
                        isAuthenticated: true,
                        signIn: get().auth.signIn,
                        signOut: get().auth.signOut,
                        refreshUser: get().auth.refreshUser,
                        checkAuthStatus: get().auth.checkAuthStatus,
                        getUser: () => user,
                    },
                    isLoading: false,
                });
                return;
            }

            // Try API refresh
            try {
                const response = await apiRequest("/api/auth/me");
                if (response.ok) {
                    const user: PuterUser = await response.json();
                    set({
                        auth: {
                            user,
                            isAuthenticated: true,
                            signIn: get().auth.signIn,
                            signOut: get().auth.signOut,
                            refreshUser: get().auth.refreshUser,
                            checkAuthStatus: get().auth.checkAuthStatus,
                            getUser: () => user,
                        },
                        isLoading: false,
                    });
                    return;
                }
            } catch (apiErr) {
                console.warn('Auth API unavailable for refresh', apiErr);
            }

            throw new Error("Failed to refresh user");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to refresh user";
            setError(msg);
        }
    };

    const init = (): void => {
        set({ puterReady: true });
        void checkAuthStatus();
    };

    // File system operations (placeholders for future backend implementation)
    const write = async (path: string, data: string | File | Blob) => {
        // Not implemented: server-side write not yet supported
        setError("File system write not implemented");
        return undefined;
    };

    const readDir = async (path: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/files`);
            if (!res.ok) return undefined;
            return await res.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : "File system list failed");
            return undefined;
        }
    };

    const readFile = async (path: string) => {
        try {
            try {
                const res = await fetch(`${API_BASE_URL}${path}`);
                if (res.ok) {
                    const blob = await res.blob();
                    return blob;
                }
            } catch (apiErr) {
                console.warn('Puter API unavailable, checking localStorage', apiErr);
            }
            
            // Fallback: try to read from localStorage
            const fileId = path.split('/').pop();
            if (fileId) {
                const fileData = localStorage.getItem(fileId);
                if (fileData) {
                    const parsed = JSON.parse(fileData);
                    // Convert base64 back to blob
                    const response = await fetch(parsed.data);
                    const blob = await response.blob();
                    return blob;
                }
            }
            
            setError("Failed to read file");
            return undefined;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to read file");
            return undefined;
        }
    };

    const upload = async (files: File[] | Blob[]) => {
        try {
            const file = files[0] as File;
            const form = new FormData();
            form.append('file', file);
            
            try {
                const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
                    method: 'POST',
                    body: form,
                });
                if (res.ok) {
                    const json = await res.json();
                    return json; // expecting {name, path, size}
                }
            } catch (apiErr) {
                // API not available, use localStorage fallback
                console.warn('Puter API unavailable, using localStorage fallback', apiErr);
            }
            
            // Fallback: store file in localStorage for demo/testing
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onload = (e) => {
                    const base64 = e.target?.result as string;
                    const fileId = `file_${Date.now()}`;
                    const fileData = {
                        name: file.name,
                        path: `/resumind/${fileId}`,
                        size: file.size,
                        type: file.type,
                        data: base64, // base64 encoded file data
                    };
                    localStorage.setItem(fileId, JSON.stringify(fileData));
                    console.log('File stored in localStorage (demo mode):', fileData.name);
                    resolve(fileData);
                };
                reader.readAsDataURL(file);
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload file');
            return undefined;
        }
    };

    const deleteFile = async (path: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE' });
            if (!res.ok) {
                setError('Failed to delete file');
                return;
            }
            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete file');
            return;
        }
    };

    // AI operations (placeholders for future backend implementation)
    const chat = async (
        prompt: string | ChatMessage[],
        imageURL?: string | PuterChatOptions,
        testMode?: boolean,
        options?: PuterChatOptions
    ) => {
        setError("AI operations not yet implemented");
        return undefined;
    };

    const feedback = async (path: string, message: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/ai/feedback?path=${encodeURIComponent(path)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            });
            if (!res.ok) {
                setError('AI feedback failed');
                return undefined;
            }
            return (await res.json()) as AIResponse;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'AI feedback failed');
            return undefined;
        }
    };

    const img2txt = async (image: string | File | Blob, testMode?: boolean) => {
        setError("AI img2txt not implemented");
        return undefined;
    };

    // Key-value operations (simple backend-backed implementation)
    const getKV = async (key: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/kv/${encodeURIComponent(key)}`);
            if (!res.ok) return null;
            return await res.text();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'KV get failed');
            return null;
        }
    };

    const setKV = async (key: string, value: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/kv/${encodeURIComponent(key)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: value,
            });
            return res.ok;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'KV set failed');
            return false;
        }
    };

    const deleteKV = async (key: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/kv/${encodeURIComponent(key)}`, { method: 'DELETE' });
            return res.ok;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'KV delete failed');
            return false;
        }
    };

    const listKV = async (pattern: string, returnValues?: boolean) => {
        try {
            const params = new URLSearchParams({
                pattern,
                returnValues: String(returnValues ?? false),
            });
            const res = await fetch(`${API_BASE_URL}/api/kv?${params.toString()}`);
            if (!res.ok) return undefined;
            return await res.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'KV list failed');
            return undefined;
        }
    };

    const flushKV = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/kv`, { method: 'DELETE' });
            return res.ok;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'KV flush failed');
            return false;
        }
    };

    return {
        isLoading: true,
        error: null,
        puterReady: false,
        auth: {
            user: null,
            isAuthenticated: false,
            signIn,
            signOut,
            refreshUser,
            checkAuthStatus,
            getUser: () => get().auth.user,
        },
        fs: {
            write: (path: string, data: string | File | Blob) => write(path, data),
            read: (path: string) => readFile(path),
            readDir: (path: string) => readDir(path),
            upload: (files: File[] | Blob[]) => upload(files),
            delete: (path: string) => deleteFile(path),
        },
        ai: {
            chat: (
                prompt: string | ChatMessage[],
                imageURL?: string | PuterChatOptions,
                testMode?: boolean,
                options?: PuterChatOptions
            ) => chat(prompt, imageURL, testMode, options),
            feedback: (path: string, message: string) => feedback(path, message),
            img2txt: (image: string | File | Blob, testMode?: boolean) =>
                img2txt(image, testMode),
        },
        kv: {
            get: (key: string) => getKV(key),
            set: (key: string, value: string) => setKV(key, value),
            delete: (key: string) => deleteKV(key),
            list: (pattern: string, returnValues?: boolean) =>
                listKV(pattern, returnValues),
            flush: () => flushKV(),
        },
        init,
        clearError: () => set({ error: null }),
    };
});
