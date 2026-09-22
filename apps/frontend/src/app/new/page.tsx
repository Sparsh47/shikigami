"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GitHubUser } from "@/types/user";
import { GitHubRepo } from "@/types/repo";
import {
    Search,
    Lock,
    Globe,
    ArrowLeft,
    Loader2,
    ArrowRight,
    FolderGit2,
    Code2,
} from "lucide-react";

export default function NewAgentPage() {
    const router = useRouter();
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [reposLoading, setReposLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<"all" | "public" | "private">("all");
    const [customGitUrl, setCustomGitUrl] = useState("");

    useEffect(() => {
        async function loadInitialData() {
            try {
                const userRes = await fetch("/api/auth/github/me");
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData.user);
                }

                const reposRes = await fetch("/api/auth/github/all_repos");
                if (reposRes.ok) {
                    const reposData = await reposRes.json();
                    if (Array.isArray(reposData.repos)) {
                        setRepos(reposData.repos);
                    }
                }
            } catch (err) {
                console.error("Failed to load repositories:", err);
            } finally {
                setReposLoading(false);
            }
        }
        loadInitialData();
    }, []);

    const filteredRepos = repos.filter((repo) => {
        const matchesQuery =
            repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType =
            filterType === "all" ? true : filterType === "private" ? repo.private : !repo.private;

        return matchesQuery && matchesType;
    });

    const handleImportRepo = (repo: GitHubRepo) => {
        const params = new URLSearchParams({
            repo: repo.full_name,
            name: repo.name,
            branch: repo.default_branch || "main",
            lang: repo.language || "",
            private: repo.private ? "1" : "0",
            url: repo.html_url || "",
        });
        router.push(`/new/configure?${params.toString()}`);
    };

    const handleCustomImport = () => {
        if (!customGitUrl.trim()) return;
        const name = customGitUrl.split("/").pop()?.replace(".git", "") || "custom-agent";
        const repoFullName = customGitUrl.replace("https://github.com/", "").replace(".git", "");
        const params = new URLSearchParams({
            repo: repoFullName,
            name: name,
            url: customGitUrl,
            branch: "main",
            private: "0",
        });
        router.push(`/new/configure?${params.toString()}`);
    };

    function formatTimeAgo(dateString?: string) {
        if (!dateString) return "Recently";
        const diffMs = Date.now() - new Date(dateString).getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        if (diffHours < 1) return "Just now";
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 30) return `${diffDays}d ago`;
        return `${Math.floor(diffDays / 30)}mo ago`;
    }

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-heading)] flex flex-col">
            <Navbar user={user} />

            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8 space-y-8">

                {/* Back + Title */}
                <div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors mb-5"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Deployments
                    </Link>

                    <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-heading)]">
                        Deploy a new agent
                    </h1>
                    <p className="mt-1.5 text-sm text-[var(--text-muted)]">
                        Import a Git repository and launch your agent runtime with Kaniko container builds.
                    </p>
                </div>

                {/* Import Repository Card */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">

                    {/* Card Header */}
                    <div className="border-b border-[var(--border)] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <FolderGit2 className="h-4 w-4 text-[var(--accent)]" />
                            <h2 className="text-sm font-semibold text-[var(--text-heading)]">Import Git Repository</h2>
                        </div>

                        {user && (
                            <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)]">
                                <img
                                    src={user.avatar_url}
                                    alt={user.login}
                                    className="h-4 w-4 rounded-full"
                                />
                                <span>{user.login}</span>
                            </div>
                        )}
                    </div>

                    {/* Search + Filter */}
                    <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-base)]/40">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search repositories..."
                                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] py-2 pl-9 pr-4 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50 focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1 shrink-0">
                                {(["all", "public", "private"] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filterType === type
                                            ? "bg-[var(--accent)] text-white"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Repository List */}
                    <div className="divide-y divide-[var(--border)] max-h-100 overflow-y-auto">
                        {reposLoading ? (
                            <div className="py-14 text-center">
                                <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--accent)]" />
                                <p className="mt-3 text-xs text-[var(--text-muted)]">Loading repositories…</p>
                            </div>
                        ) : filteredRepos.length === 0 ? (
                            <div className="py-14 text-center">
                                <Search className="mx-auto h-7 w-7 text-[var(--text-muted)] mb-3" />
                                <p className="text-sm font-medium text-[var(--text-body)]">
                                    {searchQuery ? `No results for "${searchQuery}"` : "No repositories found"}
                                </p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    {searchQuery ? "Try a different search term." : "Connect your GitHub account to see your repositories."}
                                </p>
                            </div>
                        ) : (
                            filteredRepos.map((repo) => (
                                <div
                                    key={repo.id}
                                    className="flex items-center justify-between gap-4 px-6 py-3.5 transition-colors hover:bg-[var(--bg-base)]/60"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-base)] text-[var(--text-muted)]">
                                            {repo.private ? (
                                                <Lock className="h-3 w-3" />
                                            ) : (
                                                <Globe className="h-3 w-3" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-[var(--text-heading)] truncate">
                                                    {repo.name}
                                                </span>
                                                {repo.private && (
                                                    <span className="rounded bg-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                                                        Private
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-[var(--text-muted)]">
                                                {repo.language && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                                                        {repo.language}
                                                    </span>
                                                )}
                                                <span>Updated {formatTimeAgo(repo.updated_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleImportRepo(repo)}
                                        className="shrink-0 rounded-lg bg-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-body)] hover:bg-[var(--accent)] hover:text-white transition-all inline-flex items-center gap-1.5 cursor-pointer group/btn"
                                    >
                                        <span>Import</span>
                                        <ArrowRight className="h-3 w-3 text-[var(--text-muted)] group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Custom Git URL Footer */}
                    <div className="border-t border-[var(--border)] px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-base)]/30">
                        <div className="flex items-center gap-2">
                            <Code2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                            <span className="text-xs text-[var(--text-muted)]">
                                Import from a third-party Git URL
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={customGitUrl}
                                onChange={(e) => setCustomGitUrl(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCustomImport();
                                }}
                                placeholder="https://github.com/org/repo.git"
                                className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors w-56"
                            />
                            <button
                                onClick={handleCustomImport}
                                disabled={!customGitUrl.trim()}
                                className="rounded-lg bg-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-body)] hover:bg-[var(--accent)] hover:text-white disabled:opacity-40 disabled:hover:bg-[var(--border)] disabled:hover:text-[var(--text-body)] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Import</span>
                                <ArrowRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
