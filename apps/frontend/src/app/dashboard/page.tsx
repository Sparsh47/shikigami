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
    CheckCircle2,
    XCircle,
    CircleDashed,
} from "lucide-react";

type DeployStatus = "ready" | "building" | "failed" | "queued";

function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function statusConfig(status: DeployStatus) {
    switch (status) {
        case "ready":
            return {
                label: "Ready",
                dot: "bg-emerald-400",
                badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
            };
        case "building":
            return {
                label: "Building",
                dot: "bg-amber-400 animate-pulse",
                badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                icon: <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />,
            };
        case "failed":
            return {
                label: "Failed",
                dot: "bg-red-400",
                badge: "bg-red-500/10 text-red-400 border-red-500/20",
                icon: <XCircle className="h-3.5 w-3.5 text-red-400" />,
            };
        case "queued":
            return {
                label: "Queued",
                dot: "bg-[var(--text-muted)]",
                badge: "bg-[var(--border)] text-[var(--text-muted)] border-[#3e3730]",
                icon: <CircleDashed className="h-3.5 w-3.5 text-[var(--text-muted)]" />,
            };
    }
}

export default function Dashboard() {
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [deploymentsLoading, setDeploymentsLoading] = useState(false);
    const [deploymentsError, setDeploymentsError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | DeployStatus>("all");
    const [deployments, setDeployments] = useState<AgentDeployment[]>([]);

    async function loadDeployments() {
        setDeploymentsLoading(true);
        setDeploymentsError(null);
        try {
            const res = await fetch("/api/deployments");
            if (res.status === 401) {
                setDeploymentsError("Session expired — please log in again.");
                return;
            }
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
                if (!response.ok) {
                    setLoading(false);
                    return;
                }
                const data = await response.json();
                setUser(data.user);
                await loadDeployments();
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
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
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
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
                            <Bot className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-heading)]">Authentication required</h2>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                            Sign in with your GitHub account to view your deployments.
                        </p>
                        <Link
                            href="/api/auth/github"
                            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
                        >
                            Sign in with GitHub
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // In Vercel, dashboard shows each project displaying its latest deployment
    const latestProjects = deployments.reduce<AgentDeployment[]>((acc, current) => {
        const key = current.repo || current.name;
        if (!acc.some((d) => (d.repo || d.name) === key)) {
            acc.push(current);
        }
        return acc;
    }, []);

    const filtered = latestProjects.filter((d) => {
        const matchesQuery =
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.repo.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || d.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

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
                            Projects
                        </h1>
                    </div>

                    <Link
                        href="/new"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] shrink-0 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Agent
                    </Link>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects or repositories..."
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] py-2 pl-9 pr-4 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-0 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1 shrink-0">
                        {(["all", "ready", "building", "failed"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
                                    statusFilter === s
                                        ? "bg-[var(--accent)] text-zinc-950 font-semibold"
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
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1">{deploymentsError}</span>
                        <button
                            onClick={() => user && loadDeployments()}
                            className="shrink-0 inline-flex items-center gap-1 font-medium hover:text-amber-300 transition-colors cursor-pointer"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Retry
                        </button>
                    </div>
                )}

                {/* Projects Grid — Vercel Style showing only the latest deployment per project */}
                {deploymentsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 animate-pulse space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-32 rounded bg-[var(--border)]" />
                                    <div className="h-4 w-16 rounded-full bg-[var(--border)]" />
                                </div>
                                <div className="h-3 w-40 rounded bg-[var(--border)]" />
                                <div className="space-y-2 pt-2 border-t border-[var(--border)]/50">
                                    <div className="h-3 w-28 rounded bg-[var(--border)]" />
                                    <div className="h-3 w-20 rounded bg-[var(--border)]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-surface)] text-[var(--text-muted)] mb-4">
                            <Layers className="h-5 w-5" />
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                            {searchQuery ? "No matching projects" : "No deployments yet"}
                        </h3>
                        <p className="mt-1.5 text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                            {searchQuery
                                ? "Try a different search keyword or status filter."
                                : "Connect a GitHub repository to deploy your first AI agent runtime."}
                        </p>
                        <Link
                            href="/new"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Add New Agent
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((dep) => {
                            const sc = statusConfig(dep.status);
                            return (
                                <div
                                    key={dep.id}
                                    className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)] shadow-sm hover:shadow-md"
                                >
                                    <div>
                                        {/* Top Row: Project Name & Status */}
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <Link
                                                href={`/deployments/${dep.id}`}
                                                className="text-base font-semibold text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors truncate"
                                            >
                                                {dep.name}
                                            </Link>
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border shrink-0 ${sc.badge}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                                {sc.label}
                                            </span>
                                        </div>

                                        {/* Domain link */}
                                        <div className="mb-4">
                                            <a
                                                href={dep.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] truncate max-w-full transition-colors"
                                            >
                                                <span className="truncate">{dep.url ? dep.url.replace(/^https?:\/\//, "") : "—"}</span>
                                                <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
                                            </a>
                                        </div>

                                        {/* Git Details */}
                                        <div className="space-y-1.5 border-t border-[var(--border)]/60 pt-3 text-xs text-[var(--text-muted)]">
                                            <div className="flex items-center gap-2 truncate">
                                                <GitBranch className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                                                <span className="font-mono text-[11px] truncate">{dep.repo}</span>
                                                <span className="opacity-40">•</span>
                                                <span className="font-mono text-[11px] text-[var(--text-body)]">{dep.branch}</span>
                                            </div>
                                            {dep.commitSha && (
                                                <div className="flex items-center gap-2 text-[11px]">
                                                    <GitCommit className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                                                    <span className="font-mono">{dep.commitSha.slice(0, 7)}</span>
                                                    {dep.commitMessage && (
                                                        <span className="truncate text-[var(--text-muted)] max-w-[200px]">
                                                            {dep.commitMessage}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer: Framework, Deployed time & Direct Links */}
                                    <div className="mt-5 pt-3 border-t border-[var(--border)]/60 flex items-center justify-between text-xs">
                                        <span className="text-[11px] text-[var(--text-muted)]">
                                            {relativeTime(dep.createdAt)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/deployments/${dep.id}/settings?section=deployments`}
                                                className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:border-[var(--accent)]/40 transition-colors"
                                                title="View all deployments for this project"
                                            >
                                                Deployments
                                            </Link>
                                            <Link
                                                href={`/deployments/${dep.id}`}
                                                className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-elevated)] transition-colors"
                                            >
                                                Logs
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}