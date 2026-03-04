"use client";

import { useEffect } from "react";

export default function GoogleCallback() {
    useEffect(() => {
        // This page is opened in a popup by AuthContext for Google OAuth
        // The AuthContext's setInterval will detect when this page is loaded 
        // on the same origin and read the window.location.hash
        // We don't strictly need to do anything here, but we can show a loader
    }, []);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center font-sans">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                <h1 className="text-white font-bold text-xl mb-2">Authenticating...</h1>
                <p className="text-white/40 text-sm">Finishing sign-in with Google</p>
            </div>
        </div>
    );
}
