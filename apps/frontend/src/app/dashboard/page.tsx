"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { GitHubUser } from "@/types/user";
import { AgentDeployment } from "@/types/repo";
import {
    Plus,
    Search,
    ExternalLink,
    GitBranch,
    GitCommit,
    Loader2,
    Bot,
    RefreshCw,
    Layers,
    AlertCircle,
} from "lucide-react";

type DeployStatus = "ready" | "building" | "failed" | "queued";

export default function Dashboard() {
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [deploymentsLoading, setDeploymentsLoading] = useState(false);
    const [deploymentsError, setDeploymentsError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | DeployStatus>("all");
    const [deployments, setDeployments] = useState<AgentDeployment[]>([]);

    async function loadDeployments(userId: string) {
        setDeploymentsLoading(true);
        setDeploymentsError(null);
        try {
            const res = await fetch(
                `http://localhost:8080/api/deployments?userId=${encodeURIComponent(userId)}`
            );
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const data = await res.json();
            setDeployments(data.deployments ?? []);
        } catch (err) {
            console.warn("Backend unavailable:", err);
            setDeploymentsError("Could not reach backend — make sure the API is running.");
        } finally {
            setDeploymentsLoading(false);
        }
    }

    useEffect(() => {
        async function loadUser() {
            try {
                const response = await fetch("/api/auth/github/me");
                if (!response.ok) { setLoading(false); return; }
                const data = await response.json();
                setUser(data.user);
                await loadDeployments(String(data.user.id));
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
            <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#c96b3e]" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 max-w-md w-full">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#c96b3e]/10 text-[#c96b3e] mb-4">
                            <Bot className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-heading)]">Authentication required</h2>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
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
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-heading)] flex flex-col">
            <Navbar user={user} />

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">

                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                            {user.login}
                        </p>
                        <h1 className="text-2xl font-semibold text-[var(--text-heading)] tracking-tight">
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
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search deployments..."
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] py-2 pl-9 pr-4 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:border-[#c96b3e]/50 focus:outline-none focus:ring-0 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1 shrink-0">
                        {(["all", "ready", "building", "failed"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${statusFilter === s
                                    ? "bg-[#c96b3e] text-white"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error banner if backend unreachable */}
                {deploymentsError && (
                    <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1">{deploymentsError}</span>
                        <button
                            onClick={() => user && loadDeployments(String(user.id))}
                            className="shrink-0 inline-flex items-center gap-1 font-medium hover:text-amber-300 transition-colors cursor-pointer"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                        </button>
                    </div>
                )}

                {/* Deployments List or Empty state */}
                {deploymentsLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 animate-pulse">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-2.5 flex-1">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-4 w-36 rounded-md bg-[var(--border)]" />
                                            <div className="h-4 w-16 rounded-full bg-[var(--border)]" />
                                            <div className="h-4 w-20 rounded-md bg-[var(--border)]" />
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="h-3 w-20 rounded bg-[var(--border)]" />
                                            <div className="h-3 w-32 rounded bg-[var(--border)]" />
                                            <div className="h-3 w-16 rounded bg-[var(--border)]" />
                                        </div>
                                    </div>
                                    <div className="h-8 w-16 rounded-xl bg-[var(--border)]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (() => {
                    const filtered = deployments.filter((d) => {
                        const matchesQuery =
                            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            d.repo.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesStatus = statusFilter === "all" || d.status === statusFilter;
                        return matchesQuery && matchesStatus;
                    });

                    if (filtered.length === 0) {
                        return (
                            <div className="rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-surface)] text-[var(--text-muted)] mb-4">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                                    {searchQuery ? "No matching deployments" : "No deployments yet"}
                                </h3>
                                <p className="mt-1.5 text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                                    {searchQuery
                                        ? "Try a different search keyword or status filter."
                                        : "Connect a GitHub repository to deploy your first AI agent runtime."}
                                </p>
                                <Link
                                    href="/new"
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c96b3e] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b85e34] shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add New Agent
                                </Link>
                            </div>
                        );
                    }

                    const statusBadge = (status: AgentDeployment["status"]) => {
                        switch (status) {
                            case "ready":
                                return (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        Ready
                                    </span>
                                );
                            case "building":
                                return (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                        Building
                                    </span>
                                );
                            case "failed":
                                return (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/20">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                        Failed
                                    </span>
                                );
                            case "queued":
                                return (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--border)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-muted)] border border-[#3e3730]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
                                        Queued
                                    </span>
                                );
                        }
                    };

                    return (
                        <div className="space-y-4">
                            {filtered.map((dep) => (
                                <Link
                                    key={dep.id}
                                    href={`/deployments/${dep.id}`}
                                    className="block rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 transition-all hover:border-[#c96b3e]/40 cursor-pointer"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <h3 className="text-base font-semibold text-[var(--text-heading)]">
                                                    {dep.name}
                                                </h3>
                                                {statusBadge(dep.status)}
                                                <span className="rounded-md bg-[var(--bg-base)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)] border border-[var(--border)]">
                                                    {dep.framework}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
                                                <span className="inline-flex items-center gap-1">
                                                    <GitBranch className="h-3 w-3 text-[var(--text-muted)]" />
                                                    {dep.branch}
                                                </span>
                                                <span>•</span>
                                                <span className="font-mono text-[11px]">{dep.repo}</span>
                                                <span>•</span>
                                                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                                    <GitCommit className="h-3 w-3 text-[var(--text-muted)]" />
                                                    {dep.commitSha}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-start sm:self-auto">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.open(dep.url, "_blank", "noreferrer");
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2 text-xs font-medium text-[var(--text-heading)] hover:border-[#c96b3e]/40 hover:text-white transition-colors cursor-pointer"
                                            >
                                                Visit
                                                <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    );
                })()}
            </main>
        </div>
    );
}