"use client";

import { useEffect } from "react";

export default function GitHubCallback() {
    useEffect(() => {
        // This page is opened in a popup by AuthContext
        // It receives the code from GitHub, then would normally exchange it for a token via a proxy
        // For this demo/frontend-only implementation, we simulate the success if params are present

        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const error = params.get("error");

        if (code || error) {
            window.opener.postMessage(
                {
                    type: "github-auth",
                    code,
                    error,
                    // In a real app, the backend would return the user object here
                    // For the frontend demo, we send back a mock user if code is present
                    user: code ? {
                        id: "github-" + Math.random().toString(36).substring(2, 9),
                        login: "gh_builder",
                        name: "GitHub Builder",
                        avatar_url: "https://github.com/identicons/gh.png",
                    } : null
                },
                window.location.origin
            );
        }
    }, []);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center font-sans">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                <h1 className="text-white font-bold text-xl mb-2">Authenticating...</h1>
                <p className="text-white/40 text-sm">Finishing sign-in with GitHub</p>
            </div>
        </div>
    );
}
