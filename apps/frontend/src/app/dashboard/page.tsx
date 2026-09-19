"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { GitHubUser } from "@/types/user";
import {
    Plus,
    Search,
    ExternalLink,
    GitBranch,
    GitCommit,
    Clock,
    Loader2,
    Bot,
    Server,
    RefreshCw,
    Layers,
    Circle,
    AlertCircle,
} from "lucide-react";

type DeployStatus = "ready" | "building" | "failed" | "queued";

export default function Dashboard() {
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | DeployStatus>("all");

    useEffect(() => {
        async function loadUser() {
            try {
                const response = await fetch("/api/auth/github/me");
                if (!response.ok) { setLoading(false); return; }
                const data = await response.json();
                setUser(data.user);
            } catch (error) {
                console.error("Failed to load user:", error);
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1a1714] flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#c96b3e]" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#1a1714] flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="rounded-2xl border border-[#2e2924] bg-[#211e1a] p-8 max-w-md w-full">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#c96b3e]/10 text-[#c96b3e] mb-4">
                            <Bot className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-[#e8ddd5]">Authentication required</h2>
                        <p className="mt-2 text-sm text-[#7a6e66]">
                            Sign in with your GitHub account to view your deployments.
                        </p>
                        <Link
                            href="/api/auth/github"
                            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#c96b3e] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b85e34]"
                        >
                            Sign in with GitHub
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#1a1714] text-[#e8ddd5] flex flex-col">
            <Navbar user={user} />

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">

                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-[#7a6e66] mb-1.5">
                            {user.login}
                        </p>
                        <h1 className="text-2xl font-semibold text-[#e8ddd5] tracking-tight">
                            Deployments
                        </h1>
                    </div>

                    <Link
                        href="/new"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c96b3e] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#b85e34] shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Agent
                    </Link>
                </div>

                {/* Filter & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7a6e66]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search deployments..."
                            className="w-full rounded-xl border border-[#2e2924] bg-[#211e1a] py-2 pl-9 pr-4 text-sm text-[#e8ddd5] placeholder:text-[#7a6e66] focus:border-[#c96b3e]/50 focus:outline-none focus:ring-0 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-1 rounded-xl border border-[#2e2924] bg-[#211e1a] p-1 shrink-0">
                        {(["all", "ready", "building", "failed"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                                    statusFilter === s
                                        ? "bg-[#c96b3e] text-white"
                                        : "text-[#7a6e66] hover:text-[#e8ddd5]"
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Empty state — no sample data */}
                <div className="rounded-2xl border border-dashed border-[#2e2924] py-20 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#211e1a] text-[#7a6e66] mb-4">
                        <Layers className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#e8ddd5]">No deployments yet</h3>
                    <p className="mt-1.5 text-xs text-[#7a6e66] max-w-xs mx-auto leading-relaxed">
                        Connect a GitHub repository to deploy your first AI agent runtime.
                    </p>
                    <Link
                        href="/new"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c96b3e] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b85e34] shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Agent
                    </Link>
                </div>
            </main>
        </div>
    );
}