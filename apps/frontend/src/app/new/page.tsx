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
    GitBranch,
    Loader2,
    Check,
    ArrowRight,
    Terminal,
    FolderGit2,
    Code2,
    X,
    Network,
    Cpu,
    Zap,
    BrainCircuit,
    Package,
} from "lucide-react";

const AGENT_TEMPLATES = [
    {
        title: "LangGraph RAG Agent",
        desc: "Hierarchical agent graph with document retrieval and self-reflection.",
        framework: "Python",
        Icon: BrainCircuit,
    },
    {
        title: "Multi-Agent Crew",
        desc: "Autonomous role-playing agents collaborating on research pipelines.",
        framework: "Python",
        Icon: Network,
    },
    {
        title: "Streaming API Runner",
        desc: "Stateless streaming API server with function calling and container scaling.",
        framework: "FastAPI",
        Icon: Zap,
    },
    {
        title: "TypeScript Agent Starter",
        desc: "Full-stack AI agent with Vercel AI SDK and tool execution sandbox.",
        framework: "TypeScript",
        Icon: Package,
    },
];

export default function NewAgentPage() {
    const router = useRouter();
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [reposLoading, setReposLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<"all" | "public" | "private">("all");

    const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
    const [agentName, setAgentName] = useState("");
    const [framework, setFramework] = useState("LangGraph / Python");
    const [isDeploying, setIsDeploying] = useState(false);
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

    const handleSelectRepo = (repo: GitHubRepo) => {
        setSelectedRepo(repo);
        setAgentName(repo.name);
        if (repo.language === "Python") setFramework("LangGraph / Python");
        else if (repo.language === "TypeScript" || repo.language === "JavaScript") setFramework("TypeScript / Node");
    };

    const handleDeploy = () => {
        setIsDeploying(true);
        setTimeout(() => {
            setIsDeploying(false);
            router.push("/dashboard");
        }, 1800);
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
        <div className="min-h-screen bg-[#1a1714] text-[#e8ddd5] flex flex-col">
            <Navbar user={user} />

            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8 space-y-8">

                {/* Back + Title */}
                <div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7a6e66] hover:text-[#e8ddd5] transition-colors mb-5"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Deployments
                    </Link>

                    <h1 className="text-2xl font-semibold tracking-tight text-[#e8ddd5]">
                        Deploy a new agent
                    </h1>
                    <p className="mt-1.5 text-sm text-[#7a6e66]">
                        Import a Git repository and launch your agent runtime with Kaniko container builds.
                    </p>
                </div>

                {/* Import Repository Card */}
                <div className="rounded-2xl border border-[#2e2924] bg-[#211e1a] overflow-hidden">

                    {/* Card Header */}
                    <div className="border-b border-[#2e2924] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <FolderGit2 className="h-4 w-4 text-[#c96b3e]" />
                            <h2 className="text-sm font-semibold text-[#e8ddd5]">Import Git Repository</h2>
                        </div>

                        {user && (
                            <div className="inline-flex items-center gap-2 rounded-lg border border-[#2e2924] bg-[#1a1714] px-3 py-1.5 text-xs font-medium text-[#7a6e66]">
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
                    <div className="px-6 py-4 border-b border-[#2e2924] bg-[#1a1714]/40">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7a6e66]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search repositories..."
                                    className="w-full rounded-xl border border-[#2e2924] bg-[#211e1a] py-2 pl-9 pr-4 text-sm text-[#e8ddd5] placeholder:text-[#7a6e66] focus:border-[#c96b3e]/50 focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-1 rounded-xl border border-[#2e2924] bg-[#211e1a] p-1 shrink-0">
                                {(["all", "public", "private"] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                                            filterType === type
                                                ? "bg-[#c96b3e] text-white"
                                                : "text-[#7a6e66] hover:text-[#e8ddd5]"
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Repository List */}
                    <div className="divide-y divide-[#2e2924] max-h-[400px] overflow-y-auto">
                        {reposLoading ? (
                            <div className="py-14 text-center">
                                <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#c96b3e]" />
                                <p className="mt-3 text-xs text-[#7a6e66]">Loading repositories…</p>
                            </div>
                        ) : filteredRepos.length === 0 ? (
                            <div className="py-14 text-center">
                                <Search className="mx-auto h-7 w-7 text-[#7a6e66] mb-3" />
                                <p className="text-sm font-medium text-[#c4b8b0]">
                                    {searchQuery ? `No results for "${searchQuery}"` : "No repositories found"}
                                </p>
                                <p className="mt-1 text-xs text-[#7a6e66]">
                                    {searchQuery ? "Try a different search term." : "Connect your GitHub account to see your repositories."}
                                </p>
                            </div>
                        ) : (
                            filteredRepos.map((repo) => {
                                const isSelected = selectedRepo?.id === repo.id;
                                return (
                                    <div
                                        key={repo.id}
                                        className={`flex items-center justify-between gap-4 px-6 py-3.5 transition-colors ${
                                            isSelected
                                                ? "bg-[#c96b3e]/5 border-l-2 border-l-[#c96b3e]"
                                                : "hover:bg-[#1a1714]/60"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1a1714] text-[#7a6e66] border border-[#2e2924]">
                                                {repo.private ? (
                                                    <Lock className="h-3 w-3" />
                                                ) : (
                                                    <Globe className="h-3 w-3" />
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-[#e8ddd5] truncate">
                                                        {repo.name}
                                                    </span>
                                                    {repo.private && (
                                                        <span className="rounded bg-[#2e2924] px-1.5 py-0.5 text-[10px] font-medium text-[#7a6e66]">
                                                            Private
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-[#7a6e66]">
                                                    {repo.language && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-[#c96b3e]" />
                                                            {repo.language}
                                                        </span>
                                                    )}
                                                    <span>Updated {formatTimeAgo(repo.updated_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleSelectRepo(repo)}
                                            className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                                                isSelected
                                                    ? "bg-[#c96b3e]/15 text-[#c96b3e] ring-1 ring-[#c96b3e]/30"
                                                    : "bg-[#2e2924] text-[#c4b8b0] hover:bg-[#c96b3e] hover:text-white"
                                            }`}
                                        >
                                            {isSelected ? (
                                                <span className="flex items-center gap-1.5">
                                                    <Check className="h-3 w-3" />
                                                    Selected
                                                </span>
                                            ) : (
                                                "Import"
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Custom Git URL Footer */}
                    <div className="border-t border-[#2e2924] px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1a1714]/30">
                        <div className="flex items-center gap-2">
                            <Code2 className="h-3.5 w-3.5 text-[#7a6e66]" />
                            <span className="text-xs text-[#7a6e66]">
                                Import from a third-party Git URL
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={customGitUrl}
                                onChange={(e) => setCustomGitUrl(e.target.value)}
                                placeholder="https://github.com/org/repo.git"
                                className="rounded-lg border border-[#2e2924] bg-[#211e1a] px-3 py-1.5 text-xs text-[#e8ddd5] placeholder:text-[#7a6e66] focus:outline-none focus:border-[#c96b3e]/50 transition-colors w-56"
                            />
                            <button
                                onClick={() => {
                                    if (customGitUrl.trim()) {
                                        const mockRepo: GitHubRepo = {
                                            id: Date.now(),
                                            name: customGitUrl.split("/").pop()?.replace(".git", "") || "custom-agent",
                                            full_name: customGitUrl.replace("https://github.com/", "").replace(".git", ""),
                                            private: false,
                                            html_url: customGitUrl,
                                            description: null,
                                            fork: false,
                                            url: customGitUrl,
                                            created_at: new Date().toISOString(),
                                            updated_at: new Date().toISOString(),
                                            clone_url: customGitUrl,
                                            default_branch: "main",
                                            language: null,
                                            stargazers_count: 0,
                                            owner: { login: "custom", avatar_url: "" },
                                        };
                                        handleSelectRepo(mockRepo);
                                    }
                                }}
                                className="rounded-lg border border-[#2e2924] bg-[#211e1a] px-3 py-1.5 text-xs font-medium text-[#c4b8b0] hover:bg-[#2e2924] transition-colors"
                            >
                                Import
                            </button>
                        </div>
                    </div>
                </div>

                {/* Configuration Panel (shows when repo selected) */}
                {selectedRepo && (
                    <div className="rounded-2xl border border-[#c96b3e]/25 bg-[#211e1a] overflow-hidden">
                        <div className="flex items-center justify-between border-b border-[#2e2924] px-6 py-4">
                            <div>
                                <p className="text-xs font-medium text-[#c96b3e] uppercase tracking-wider mb-0.5">
                                    Configure Deployment
                                </p>
                                <h3 className="text-base font-semibold text-[#e8ddd5]">
                                    {selectedRepo.full_name}
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedRepo(null)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#7a6e66] hover:bg-[#2e2924] hover:text-[#e8ddd5] transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="px-6 py-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-medium text-[#7a6e66] mb-1.5">
                                    Agent Name
                                </label>
                                <input
                                    type="text"
                                    value={agentName}
                                    onChange={(e) => setAgentName(e.target.value)}
                                    className="w-full rounded-xl border border-[#2e2924] bg-[#1a1714] px-3.5 py-2 text-sm text-[#e8ddd5] focus:border-[#c96b3e]/50 focus:outline-none transition-colors"
                                />
                                <p className="mt-1.5 text-[11px] text-[#7a6e66] font-mono">
                                    → {agentName || "agent"}.shikigami.app
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#7a6e66] mb-1.5">
                                    Framework / Runtime
                                </label>
                                <select
                                    value={framework}
                                    onChange={(e) => setFramework(e.target.value)}
                                    className="w-full rounded-xl border border-[#2e2924] bg-[#1a1714] px-3.5 py-2 text-sm text-[#e8ddd5] focus:border-[#c96b3e]/50 focus:outline-none transition-colors"
                                >
                                    <option value="LangGraph / Python">LangGraph / LangChain (Python)</option>
                                    <option value="CrewAI">CrewAI Multi-Agent</option>
                                    <option value="FastAPI / Python">FastAPI (Python)</option>
                                    <option value="TypeScript / Node">TypeScript / Vercel AI SDK</option>
                                    <option value="Custom Dockerfile">Custom Kaniko Dockerfile</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#7a6e66] mb-1.5">
                                    Branch
                                </label>
                                <div className="flex items-center gap-2 rounded-xl border border-[#2e2924] bg-[#1a1714] px-3.5 py-2 text-sm text-[#c4b8b0]">
                                    <GitBranch className="h-3.5 w-3.5 text-[#7a6e66]" />
                                    <span>{selectedRepo.default_branch || "main"}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#7a6e66] mb-1.5">
                                    Container Engine
                                </label>
                                <div className="flex items-center gap-2 rounded-xl border border-[#2e2924] bg-[#1a1714] px-3.5 py-2 text-sm text-[#c4b8b0]">
                                    <Terminal className="h-3.5 w-3.5 text-[#c96b3e]" />
                                    <span>Kaniko (In-Cluster Builder)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-[#2e2924] px-6 py-4">
                            <button
                                onClick={() => setSelectedRepo(null)}
                                className="rounded-xl border border-[#2e2924] px-4 py-2 text-xs font-medium text-[#7a6e66] hover:bg-[#2e2924] hover:text-[#e8ddd5] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeploy}
                                disabled={isDeploying || !agentName.trim()}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#c96b3e] px-5 py-2 text-xs font-semibold text-white hover:bg-[#b85e34] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                {isDeploying ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Building…
                                    </>
                                ) : (
                                    <>
                                        Deploy Agent
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Templates */}
                <div>
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold text-[#e8ddd5]">
                            Start from a template
                        </h2>
                        <p className="text-xs text-[#7a6e66] mt-0.5">
                            Pre-configured agent architectures ready for deployment.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {AGENT_TEMPLATES.map((tmpl, idx) => {
                            const Icon = tmpl.Icon;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        const mockRepo: GitHubRepo = {
                                            id: 2000 + idx,
                                            name: tmpl.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                                            full_name: `templates/${tmpl.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
                                            private: false,
                                            html_url: "https://github.com",
                                            description: tmpl.desc,
                                            fork: false,
                                            url: "",
                                            created_at: new Date().toISOString(),
                                            updated_at: new Date().toISOString(),
                                            clone_url: "",
                                            default_branch: "main",
                                            language: tmpl.framework,
                                            stargazers_count: 0,
                                            owner: { login: "shikigami-templates", avatar_url: "" },
                                        };
                                        handleSelectRepo(mockRepo);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="group text-left flex flex-col rounded-2xl border border-[#2e2924] bg-[#211e1a] p-5 hover:border-[#c96b3e]/40 hover:bg-[#1a1714]/60 transition-all"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1714] text-[#c96b3e] border border-[#2e2924] mb-3 transition-colors group-hover:border-[#c96b3e]/40">
                                        <Icon className="h-4 w-4" />
                                    </div>

                                    <h3 className="text-sm font-medium text-[#e8ddd5] group-hover:text-white transition-colors">
                                        {tmpl.title}
                                    </h3>
                                    <p className="mt-1 text-[11px] text-[#7a6e66] line-clamp-2 leading-relaxed flex-1">
                                        {tmpl.desc}
                                    </p>

                                    <div className="mt-3 pt-3 border-t border-[#2e2924] flex items-center justify-between">
                                        <span className="text-[10px] font-medium text-[#7a6e66]">
                                            {tmpl.framework}
                                        </span>
                                        <span className="text-[11px] font-semibold text-[#c96b3e] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                                            Use template
                                            <ArrowRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
