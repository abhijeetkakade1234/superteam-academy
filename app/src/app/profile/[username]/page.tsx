"use client";

import { useParams } from "next/navigation";
import { MeshGradient } from "@/components/MeshGradient";
import { GridPattern } from "@/components/GridPattern";
import {
    Trophy, Zap, Calendar, Twitter, Github, Globe,
    Shield, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { getXPBalance, calculateLevel, getCredentials } from "@/lib/blockchain";
import { Credential } from "@/types";
import { PublicKey } from "@solana/web3.js";
import { useI18n } from "@/components/I18nProvider";

const COMPLETED_COURSES = [
    { id: "anchor-fundamentals", title: "Anchor Fundamentals", completedAt: "2026-01-15", xp: 1200 },
];

const SKILLS = [
    { name: "Rust", level: 85 },
    { name: "Anchor", level: 75 },
    { name: "Solana", level: 80 },
    { name: "Frontend", level: 60 },
    { name: "Security", level: 50 },
];

function RadarChart({ skills }: { skills: { name: string; level: number }[] }) {
    const size = 300;
    const center = size / 2;
    const radius = (size / 2) - 40;
    const angleStep = (Math.PI * 2) / skills.length;

    const getCoordinatesForAngle = (angle: number, length: number) => {
        return {
            x: center + Math.cos(angle - Math.PI / 2) * length,
            y: center + Math.sin(angle - Math.PI / 2) * length
        };
    };

    const levels = [20, 40, 60, 80, 100];

    const dataPoints = skills.map((skill, i) => {
        const angle = i * angleStep;
        return getCoordinatesForAngle(angle, (skill.level / 100) * radius);
    });

    const pathData = dataPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ") + " Z";

    return (
        <div className="flex justify-center items-center p-4">
            <svg width={size} height={size} className="overflow-visible">
                {levels.map((level, index) => {
                    const levelRadius = (level / 100) * radius;
                    const points = skills.map((_, i) => getCoordinatesForAngle(i * angleStep, levelRadius))
                        .map(p => `${p.x},${p.y}`).join(" ");
                    return (
                        <polygon key={index} points={points} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    );
                })}
                {skills.map((_, i) => {
                    const { x, y } = getCoordinatesForAngle(i * angleStep, radius);
                    return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
                })}
                <path d={pathData} fill="rgba(250, 204, 21, 0.4)" stroke="rgba(250, 204, 21, 1)" strokeWidth="2" />
                {dataPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#facc15" />
                ))}
                {skills.map((skill, i) => {
                    const { x, y } = getCoordinatesForAngle(i * angleStep, radius + 25);
                    return (
                        <text key={i} x={x} y={y} fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle" dominantBaseline="middle">
                            {skill.name}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}

export default function PublicProfilePage() {
    const { t } = useI18n();
    const params = useParams();
    const username = params.username as string;

    const [stats, setStats] = useState({
        xp: 0,
        level: 1,
        achievements: 4,
    });

    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUserData = useCallback(async () => {
        try {
            setLoading(true);

            // We will pretend the username is a valid pubkey or just use a dummy one for the stub
            let pubkey: PublicKey;
            try {
                pubkey = new PublicKey(username);
            } catch (e) {
                // Fallback to a dummy public key for non-pubkey usernames 
                pubkey = new PublicKey("11111111111111111111111111111111");
            }

            const xp = await getXPBalance(pubkey);
            const level = calculateLevel(xp);
            const creds = await getCredentials(pubkey);

            setStats({
                xp: xp + 500, // Modifying mock slightly to show it's a different user
                level: calculateLevel(xp + 500),
                achievements: 4,
            });

            setCredentials(creds);
        } catch (error) {
            console.error("Error loading user data:", error);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        if (username) {
            loadUserData();
        }
    }, [username, loadUserData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative">
            <MeshGradient />
            <GridPattern />

            <main className="pt-14 relative z-10">
                <div className="max-w-4xl mx-auto px-6 py-12">
                    {/* Profile Header */}
                    <div className="flex flex-col md:flex-row gap-8 mb-12">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center text-4xl font-bold text-white border-4 border-black ring-2 ring-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                            {username.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-3xl font-semibold break-all">{username}</h1>
                                <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm font-medium whitespace-nowrap">
                                    {t("dashboard.level") || "Level"} {stats.level}
                                </span>
                            </div>

                            <p className="text-white/60 mb-4 max-w-2xl">
                                Passionate Solana developer building the future of Web3. Dedicated to creating high-performance, secure decentralized applications.
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm text-white/40 mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {t("profile.joined", { date: "November 2025" }) || "Joined November 2025"}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    {stats.xp.toLocaleString()} XP
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-orange-400" />
                                    {t("profile.achievementsCount", { count: stats.achievements }) || `${stats.achievements} Achievements`}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <a href="#" className="p-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                                    <Twitter className="w-4 h-4" />
                                </a>
                                <a href="#" className="p-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                                    <Github className="w-4 h-4" />
                                </a>
                                <a href="#" className="p-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors">
                                    <Globe className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Credentials */}
                    <section className="mb-12">
                        <h2 className="text-xl font-semibold mb-6">{t("profile.credentials") || "Credentials"}</h2>
                        {credentials.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-4">
                                {credentials.map((cred) => (
                                    <div
                                        key={cred.id}
                                        className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center gap-4 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                            <Shield className="w-8 h-8 text-white relative z-10" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-white">{cred.track}</h3>
                                            <p className="text-white/60 text-sm mt-1">{t("dashboard.level") || "Level"} {cred.level}</p>
                                        </div>
                                        <a
                                            href={`https://explorer.solana.com/address/${cred.mintAddress}?cluster=devnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-black/40 border border-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                            title="Verify on Explorer"
                                        >
                                            <ExternalLink className="w-4 h-4 text-white/80" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/40">
                                {t("profile.noCredentials") || "No credentials earned yet."}
                            </div>
                        )}
                    </section>

                    {/* Skills Radar Chart */}
                    <section className="mb-12">
                        <h2 className="text-xl font-semibold mb-6">{t("profile.skills") || "Skills Radar"}</h2>
                        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6">
                            <RadarChart skills={SKILLS} />
                        </div>
                    </section>

                    {/* Completed Courses */}
                    <section>
                        <h2 className="text-xl font-semibold mb-6">{t("profile.completedCourses") || "Completed Courses"}</h2>
                        <div className="space-y-4">
                            {COMPLETED_COURSES.map((course) => (
                                <div
                                    key={course.id}
                                    className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between"
                                >
                                    <div>
                                        <h3 className="font-medium mb-1">{course.title}</h3>
                                        <p className="text-white/40 text-sm">Completed {course.completedAt}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-yellow-400 font-medium">{course.xp} XP</div>
                                        <Link
                                            href={`/certificates/${course.id}`}
                                            className="text-white/40 text-sm hover:text-white mt-1 inline-block"
                                        >
                                            {t("profile.viewCertificate") || "View Certificate"}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
