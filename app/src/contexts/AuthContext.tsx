"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";

// ── Types ────────────────────────────────────────────────────────────────────

export type AuthMethod = "wallet" | "google" | "github" | null;

export interface AuthUser {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
    provider: AuthMethod;
}

interface AuthContextType {
    isAuthenticated: boolean;
    authMethod: AuthMethod;
    user: AuthUser | null;
    walletAddress: string | null;
    signInWithGoogle: () => Promise<void>;
    signInWithGitHub: () => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "superteam_auth_session";

// ── Helpers ──────────────────────────────────────────────────────────────────

function persistSession(user: AuthUser) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
        /* SSR / private mode */
    }
}

function loadSession(): AuthUser | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function clearSession() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* SSR / private mode */
    }
}

// ── Google OAuth (popup) ─────────────────────────────────────────────────────

async function googleOAuthPopup(): Promise<AuthUser> {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
        // Demo / fallback when no client ID is configured
        return {
            id: "google-demo-" + Date.now(),
            name: "Google User",
            email: "user@gmail.com",
            avatar: undefined,
            provider: "google",
        };
    }

    return new Promise((resolve, reject) => {
        const redirectUri = `${window.location.origin}/api/auth/google/callback`;
        const scope = "openid email profile";
        const url =
            `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=token` +
            `&scope=${encodeURIComponent(scope)}` +
            `&prompt=select_account`;

        const w = 500;
        const h = 600;
        const left = window.screenX + (window.innerWidth - w) / 2;
        const top = window.screenY + (window.innerHeight - h) / 2;

        const popup = window.open(
            url,
            "google-signin",
            `width=${w},height=${h},left=${left},top=${top}`
        );

        if (!popup) {
            reject(new Error("Popup blocked"));
            return;
        }

        const timer = setInterval(() => {
            try {
                if (popup.closed) {
                    clearInterval(timer);
                    reject(new Error("Popup closed"));
                    return;
                }
                const hash = popup.location.hash;
                if (hash && hash.includes("access_token")) {
                    clearInterval(timer);
                    const params = new URLSearchParams(hash.substring(1));
                    const accessToken = params.get("access_token");
                    popup.close();

                    // Fetch profile
                    fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    })
                        .then((r) => r.json())
                        .then((profile) => {
                            resolve({
                                id: profile.sub,
                                name: profile.name,
                                email: profile.email,
                                avatar: profile.picture,
                                provider: "google",
                            });
                        })
                        .catch(reject);
                }
            } catch {
                /* cross-origin — ignore until redirect back */
            }
        }, 500);

        // 2-minute timeout
        setTimeout(() => {
            clearInterval(timer);
            if (!popup.closed) popup.close();
            reject(new Error("Auth timed out"));
        }, 120_000);
    });
}

// ── GitHub OAuth (popup) ─────────────────────────────────────────────────────

async function githubOAuthPopup(): Promise<AuthUser> {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

    if (!clientId) {
        // Demo / fallback when no client ID is configured
        return {
            id: "github-demo-" + Date.now(),
            name: "GitHub User",
            email: "dev@github.com",
            avatar: undefined,
            provider: "github",
        };
    }

    return new Promise((resolve, reject) => {
        const redirectUri = `${window.location.origin}/api/auth/github/callback`;
        const scope = "read:user user:email";
        const state = Math.random().toString(36).substring(2);
        const url =
            `https://github.com/login/oauth/authorize` +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=${encodeURIComponent(scope)}` +
            `&state=${state}`;

        const w = 500;
        const h = 700;
        const left = window.screenX + (window.innerWidth - w) / 2;
        const top = window.screenY + (window.innerHeight - h) / 2;

        const popup = window.open(
            url,
            "github-signin",
            `width=${w},height=${h},left=${left},top=${top}`
        );

        if (!popup) {
            reject(new Error("Popup blocked"));
            return;
        }

        // Listen for message from callback page
        const handler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type === "github-auth") {
                window.removeEventListener("message", handler);
                if (!popup.closed) popup.close();

                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve({
                        id: event.data.user.id,
                        name: event.data.user.name || event.data.user.login,
                        email: event.data.user.email,
                        avatar: event.data.user.avatar_url,
                        provider: "github",
                    });
                }
            }
        };
        window.addEventListener("message", handler);

        // 2-minute timeout
        setTimeout(() => {
            window.removeEventListener("message", handler);
            if (!popup.closed) popup.close();
            reject(new Error("Auth timed out"));
        }, 120_000);
    });
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const { connected, publicKey, disconnect } = useWallet();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [mounted, setMounted] = useState(false);

    // Hydrate from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const saved = loadSession();
        if (saved) setUser(saved);
    }, []);

    // Sync wallet connection → auth state
    useEffect(() => {
        if (!mounted) return;

        if (connected && publicKey) {
            const walletUser: AuthUser = {
                id: publicKey.toBase58(),
                name: publicKey.toBase58().slice(0, 4) + "..." + publicKey.toBase58().slice(-4),
                provider: "wallet",
            };
            // Only override if not already authenticated via OAuth
            if (!user || user.provider === "wallet") {
                setUser(walletUser);
                persistSession(walletUser);
            }
        } else if (!connected && user?.provider === "wallet") {
            setUser(null);
            clearSession();
        }
    }, [connected, publicKey, mounted]);  // eslint-disable-line react-hooks/exhaustive-deps

    const signInWithGoogle = useCallback(async () => {
        const googleUser = await googleOAuthPopup();
        setUser(googleUser);
        persistSession(googleUser);
    }, []);

    const signInWithGitHub = useCallback(async () => {
        const githubUser = await githubOAuthPopup();
        setUser(githubUser);
        persistSession(githubUser);
    }, []);

    const signOut = useCallback(() => {
        setUser(null);
        clearSession();
        // If wallet is connected, disconnect it too
        if (connected) {
            disconnect().catch(console.error);
        }
    }, [connected, disconnect]);

    const isAuthenticated = !!user;
    const authMethod = user?.provider ?? null;
    const walletAddress = connected && publicKey ? publicKey.toBase58() : null;

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                authMethod,
                user,
                walletAddress,
                signInWithGoogle,
                signInWithGitHub,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
