import { create } from "zustand";

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

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

interface FSItem {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
}

interface KVItem {
    key: string;
    value: string;
}

interface AIResponse {
    message?: string;
    text?: string;
    [key: string]: unknown;
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
        upload: (file: File[] | Blob[]) => Promise<FSItem | undefined>;
        delete: (path: string) => Promise<void>;
        readDir: (path: string) => Promise<FSItem[] | undefined>;
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
const setAuthToken = (token: string): void => {
    if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
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
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
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

            const response = await apiRequest("/api/auth/me");
            if (!response.ok) {
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
            }

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
            // In a real app, this would open a login dialog or redirect to login page
            // For now, we'll assume the user is redirected to /auth and that endpoint handles it
            const response = await apiRequest("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                throw new Error("Sign in failed");
            }

            const data: AuthResponse = await response.json();
            setAuthToken(data.accessToken);

            set({
                auth: {
                    user: data.user,
                    isAuthenticated: true,
                    signIn: get().auth.signIn,
                    signOut: get().auth.signOut,
                    refreshUser: get().auth.refreshUser,
                    checkAuthStatus: get().auth.checkAuthStatus,
                    getUser: () => data.user,
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
            await apiRequest("/api/auth/logout", {
                method: "POST",
            });

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
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Sign out failed";
            setError(msg);
        }
    };

    const refreshUser = async (): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
            const response = await apiRequest("/api/auth/me");
            if (!response.ok) {
                throw new Error("Failed to refresh user");
            }

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
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to refresh user";
            setError(msg);
        }
    };

    const init = (): void => {
        set({ puterReady: true });
        checkAuthStatus();
    };

    // File system operations (placeholders for future backend implementation)
    const write = async (path: string, data: string | File | Blob) => {
        setError("File system operations not yet implemented");
        return;
    };

    const readDir = async (path: string) => {
        setError("File system operations not yet implemented");
        return;
    };

    const readFile = async (path: string) => {
        setError("File system operations not yet implemented");
        return;
    };

    const upload = async (files: File[] | Blob[]) => {
        setError("File system operations not yet implemented");
        return;
    };

    const deleteFile = async (path: string) => {
        setError("File system operations not yet implemented");
        return;
    };

    // AI operations (placeholders for future backend implementation)
    const chat = async (
        prompt: string | ChatMessage[],
        imageURL?: string | PuterChatOptions,
        testMode?: boolean,
        options?: PuterChatOptions
    ) => {
        setError("AI operations not yet implemented");
        return;
    };

    const feedback = async (path: string, message: string) => {
        setError("AI operations not yet implemented");
        return;
    };

    const img2txt = async (image: string | File | Blob, testMode?: boolean) => {
        setError("AI operations not yet implemented");
        return;
    };

    // Key-value operations (placeholders for future backend implementation)
    const getKV = async (key: string) => {
        setError("KV operations not yet implemented");
        return;
    };

    const setKV = async (key: string, value: string) => {
        setError("KV operations not yet implemented");
        return;
    };

    const deleteKV = async (key: string) => {
        setError("KV operations not yet implemented");
        return;
    };

    const listKV = async (pattern: string, returnValues?: boolean) => {
        setError("KV operations not yet implemented");
        return;
    };

    const flushKV = async () => {
        setError("KV operations not yet implemented");
        return;
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
