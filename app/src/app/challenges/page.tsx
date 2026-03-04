"use client";

import { useState, useEffect } from "react";
import { MeshGradient } from "@/components/MeshGradient";
import { GridPattern } from "@/components/GridPattern";
import {
    Zap, Trophy, Clock, ArrowRight, Shield,
    CheckCircle2, XCircle, ChevronRight, Play,
    Calendar, ListChecks, History
} from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { CodeEditor } from "@/components/CodeEditor";
import { motion, AnimatePresence } from "framer-motion";

const DAILY_CHALLENGE = {
    id: "42",
    title: "Implement a PDA-based Counter Program",
    description: "Create a Solana program using Anchor that initializes a counter PDA and provides increment/decrement instructions. The counter should track the authority and enforce access control.",
    difficulty: "Intermediate",
    xp: 200,
    tags: ["ANCHOR", "PDA", "ACCESS CONTROL"],
    starterCode: `use anchor_lang::prelude::*;

declare_id!("YourProgramId");

#[program]
pub mod counter {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // TODO: Initialize the counter account
        // Set count to 0 and authority to the signer
        Ok(())
    }

    pub fn increment(ctx: Context<Update>) -> Result<()> {
        // TODO: Increment the counter
        // Only the authority should be able to increment
        Ok(())
    }

    pub fn decrement(ctx: Context<Update>) -> Result<()> {
        // TODO: Decrement the counter
        // Prevent underflow (count should not go below 0)
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // TODO: Define accounts for initialization
}

#[derive(Accounts)]
pub struct Update<'info> {
    // TODO: Define accounts for update
}

#[account]
pub struct Counter {
    // TODO: Define counter state
}`,
    testCases: [
        { id: 1, text: "Counter initializes with count = 0", passed: true },
        { id: 2, text: "Authority can increment the counter", passed: true },
        { id: 3, text: "Authority can decrement the counter", passed: true },
        { id: 4, text: "Non-authority cannot modify the counter", passed: false },
        { id: 5, text: "Counter cannot go below 0", passed: false },
    ]
};

const SPEED_BOARD = [
    { rank: 1, builder: "sol_speedster", address: "S0", time: "04:23", xp: 12400 },
    { rank: 2, builder: "anchor_pro", address: "AN", time: "05:01", xp: 11200 },
    { rank: 3, builder: "rust_machine", address: "RU", time: "05:34", xp: 10800 },
    { rank: 4, builder: "defi_builder", address: "DE", time: "06:12", xp: 9600 },
    { rank: 5, builder: "pda_expert", address: "PD", time: "06:45", xp: 8900 },
];

export default function ChallengesPage() {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState<"today" | "past" | "speed" | "seasonal">("today");
    const [code, setCode] = useState(DAILY_CHALLENGE.starterCode);
    const [isRunning, setIsRunning] = useState(false);
    const [timer, setTimer] = useState(1800); // 30 minutes in seconds
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        let interval: any;
        if (hasStarted && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [hasStarted, timer]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        setHasStarted(true);
    };

    const handleSubmit = () => {
        setIsRunning(true);
        setTimeout(() => setIsRunning(false), 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white relative">
            <MeshGradient />
            <GridPattern />

            <main className="pt-24 pb-16 relative z-10">
                <div className="max-w-6xl mx-auto px-6">
                    {/* Hero Section */}
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-4 text-purple-400 font-mono text-sm uppercase tracking-widest">
                            <Zap className="w-4 h-4 fill-purple-400" />
                            {t("challenges.dailyChallenges")}
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic flex items-center gap-4">
                            <span
                                className="inline-block"
                                style={{
                                    background: "linear-gradient(135deg, #9945FF 0%, #14F195 50%, #9945FF 100%)",
                                    backgroundSize: "200% 200%",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                {t("challenges.title")}
                            </span>
                        </h1>
                        <p className="text-xl text-white/50 max-w-2xl flex items-start gap-2">
                            <span className="text-purple-400 mt-1.5"><ChevronRight className="w-5 h-5" /></span>
                            {t("challenges.subtitle")}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap items-center gap-2 mb-8 p-1 bg-white/5 border border-white/10 rounded-lg w-fit">
                        {[
                            { id: "today", label: t("challenges.todayChallenge"), icon: Zap },
                            { id: "past", label: t("challenges.pastChallenges"), icon: History },
                            { id: "speed", label: t("challenges.speedBoard"), icon: Trophy },
                            { id: "seasonal", label: t("challenges.seasonalEvents"), icon: Calendar },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-3 px-5 py-2.5 rounded-md text-sm font-bold uppercase tracking-tight transition-all ${activeTab === tab.id
                                    ? "bg-purple-500 text-white"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "fill-white" : ""}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === "today" && (
                            <motion.div
                                key="today"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid lg:grid-cols-3 gap-8"
                            >
                                {/* Editor & Details */}
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                                        <div className="flex items-start justify-between mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-purple-400/50 font-mono text-xs font-bold uppercase tracking-widest">
                                                        CHALLENGE #42
                                                    </span>
                                                    <span className="text-purple-400 font-bold text-xs px-2 py-0.5 border border-purple-400/30 rounded uppercase tracking-tighter">
                                                        {DAILY_CHALLENGE.difficulty}
                                                    </span>
                                                </div>
                                                <h2 className="text-4xl font-bold mb-3">{DAILY_CHALLENGE.title}</h2>
                                                <p className="text-white/60 leading-relaxed mb-6">
                                                    {DAILY_CHALLENGE.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {DAILY_CHALLENGE.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] font-black tracking-widest px-2.5 py-1 bg-white/5 border border-white/10 rounded text-white/40">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            {!hasStarted && (
                                                <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl border border-white/5 transition-all">
                                                    <button
                                                        onClick={handleStart}
                                                        className="px-8 py-4 bg-white text-black font-black uppercase text-lg rounded-xl hover:scale-105 transition-transform flex items-center gap-3"
                                                    >
                                                        <Play className="w-6 h-6 fill-black" />
                                                        {t("challenges.startChallenge")}
                                                    </button>
                                                </div>
                                            )}
                                            <CodeEditor
                                                value={code}
                                                onChange={setCode}
                                                language="rust"
                                                height="500px"
                                                readOnly={!hasStarted}
                                            />
                                        </div>

                                        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                                            <button
                                                disabled={isRunning || !hasStarted}
                                                onClick={handleSubmit}
                                                className={`flex-1 w-full py-4 rounded-xl font-black uppercase text-lg flex items-center justify-center gap-3 transition-all ${isRunning || !hasStarted
                                                    ? "bg-white/5 text-white/20"
                                                    : "bg-white text-black hover:bg-white/90 active:scale-[0.98]"
                                                    }`}
                                            >
                                                {isRunning ? (
                                                    <Clock className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <Play className="w-6 h-6 fill-current" />
                                                )}
                                                {t("challenges.submitSolution")}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Test Cases */}
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                                                <ListChecks className="w-4 h-4" />
                                                Test Cases
                                            </h3>
                                            <div className="space-y-3">
                                                {DAILY_CHALLENGE.testCases.map((test) => (
                                                    <div key={test.id} className="flex items-start gap-3 p-4 bg-zinc-950/30 border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
                                                        {test.passed ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                                        )}
                                                        <span className={`text-sm font-medium ${test.passed ? "text-white/80" : "text-white/40"}`}>
                                                            {test.text}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                Progressive Hints
                                            </h3>
                                            <div className="space-y-2">
                                                {[
                                                    { n: 1, xp: 25 },
                                                    { n: 2, xp: 50 },
                                                    { n: 3, xp: 75 },
                                                ].map((hint) => (
                                                    <button
                                                        key={hint.n}
                                                        className="w-full flex items-center gap-3 p-4 bg-zinc-950/30 border border-white/5 rounded-xl hover:bg-purple-500/10 transition-all text-left group"
                                                    >
                                                        <Shield className="w-4 h-4 text-white/20 group-hover:text-purple-400 transition-colors" />
                                                        <span className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">
                                                            {t("challenges.revealHint", { n: hint.n, xp: hint.xp })}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Stats */}
                                <div className="space-y-6">
                                    <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-xs font-black uppercase tracking-widest text-white/30">{t("challenges.timeRemaining")}</label>
                                            <div className="flex items-center gap-4">
                                                <Clock className={`w-8 h-8 ${timer < 300 ? "text-red-500 animate-pulse" : "text-white/60"}`} />
                                                <span className={`text-5xl font-black tabular-nums ${timer < 300 ? "text-red-500" : "text-white"}`}>
                                                    {formatTime(timer)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                <Zap className="w-5 h-5 text-purple-400 mb-2 fill-purple-400" />
                                                <div className="text-2xl font-black">{DAILY_CHALLENGE.xp} XP</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-white/30">{t("challenges.reward")}</div>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                <Trophy className="w-5 h-5 text-purple-400 mb-2" />
                                                <div className="text-2xl font-black">#42</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Top 1%</div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/10 flex items-center justify-between text-white/40 text-xs font-bold uppercase tracking-tight">
                                            <div className="flex items-center gap-2">
                                                <Play className="w-3 h-3 fill-white/20" />
                                                127 {t("challenges.attempts")}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3 text-white/20" />
                                                43 {t("challenges.solved")}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coming Soon Card Small */}
                                    <div className="border border-dashed border-white/20 bg-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                            <Shield className="w-6 h-6 text-white/40" />
                                        </div>
                                        <h3 className="text-sm font-bold mb-1 text-white/60">{t("challenges.moreChallenges")}</h3>
                                        <p className="text-white/30 text-[11px]">
                                            {t("challenges.comingSoonDesc")}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "speed" && (
                            <motion.div
                                key="speed"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                <div className="bg-zinc-950/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-purple-400/5">
                                        <div className="flex items-center gap-3">
                                            <Trophy className="w-6 h-6 text-purple-400" />
                                            <h2 className="text-xl font-black uppercase italic tracking-tight">
                                                {t("challenges.speedBoard")} — CHALLENGE #42
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/5">
                                                    <th className="px-8 py-4">{t("challenges.rank")}</th>
                                                    <th className="px-8 py-4">{t("challenges.builder")}</th>
                                                    <th className="px-8 py-4">{t("challenges.solveTime")}</th>
                                                    <th className="px-8 py-4">TOTAL XP</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {SPEED_BOARD.map((user) => (
                                                    <tr key={user.rank} className="group hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-8 py-6">
                                                            {user.rank <= 3 ? (
                                                                <div className="w-8 h-8 rounded-full border border-purple-400/30 flex items-center justify-center">
                                                                    <Trophy className={`w-4 h-4 ${user.rank === 1 ? "text-yellow-400" :
                                                                        user.rank === 2 ? "text-gray-300" :
                                                                            "text-amber-600"
                                                                        }`} />
                                                                </div>
                                                            ) : (
                                                                <span className="text-white/40 font-mono text-lg ml-2 font-bold">#{user.rank}</span>
                                                            )}
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center font-black text-xs text-white/40 border border-white/10 uppercase tracking-tighter">
                                                                    {user.address}
                                                                </div>
                                                                <span className="font-bold text-lg group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                                                                    {user.builder}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="text-green-400 font-mono text-xl font-black">{user.time}</span>
                                                        </td>
                                                        <td className="px-8 py-6 text-white/60 font-mono font-bold">
                                                            {user.xp.toLocaleString()} XP
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {(activeTab === "past" || activeTab === "seasonal") && (
                            <motion.div
                                key="coming-soon"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-32 text-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center mb-6">
                                    <Clock className="w-10 h-10 text-white/20" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                                <p className="text-white/40 max-w-sm">
                                    We're building an archive of all previous challenges and special seasonal events. Stay tuned!
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
