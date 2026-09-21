"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GitHubUser } from "@/types/user";
import { AgentDeployment } from "@/types/repo";
import {
    ArrowLeft,
    GitBranch,
    GitCommit,
    Clock,
    ExternalLink,
    Loader2,
    RefreshCw,
    Terminal,
    CheckCircle2,
    XCircle,
    CircleDashed,
    Cpu,
    Globe,
    Copy,
    Check,
    AlertTriangle,
    Box,
    Layers,
    Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeployStatus = "ready" | "building" | "failed" | "queued";

interface LogLine {
    ts: string;
    level: "info" | "warn" | "error" | "debug";
    msg: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusConfig(status: DeployStatus) {
    switch (status) {
        case "ready":
            return {
                label: "Ready",
                dot: "bg-emerald-400",
                badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
            };
        case "building":
            return {
                label: "Building",
                dot: "bg-amber-400 animate-pulse",
                badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                icon: <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />,
            };
        case "failed":
            return {
                label: "Failed",
                dot: "bg-red-400",
                badge: "bg-red-500/10 text-red-400 border-red-500/20",
                icon: <XCircle className="h-4 w-4 text-red-400" />,
            };
        case "queued":
            return {
                label: "Queued",
                dot: "bg-[#7a6e66]",
                badge: "bg-[#2e2924] text-[#7a6e66] border-[#3e3730]",
                icon: <CircleDashed className="h-4 w-4 text-[#7a6e66]" />,
            };
    }
}

function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function logLevelColor(level: LogLine["level"]) {
    switch (level) {
        case "error": return "text-red-400";
        case "warn": return "text-amber-400";
        case "info": return "text-[#c4b8b0]";
        case "debug": return "text-[#7a6e66]";
    }
}

// ─── Mock log generator (replace with real SSE/WS later) ─────────────────────

const BUILD_LOG_SEQUENCE: Omit<LogLine, "ts">[] = [
    { level: "info", msg: "Initializing Kaniko build context…" },
    { level: "info", msg: "Cloning repository from GitHub…" },
    { level: "debug", msg: "git clone --depth=1 --branch main" },
    { level: "info", msg: "Checking out commit HEAD" },
    { level: "info", msg: "Detecting Dockerfile…" },
    { level: "warn", msg: "No Dockerfile found, using framework preset." },
    { level: "info", msg: "Generating Dockerfile from LangGraph preset" },
    { level: "info", msg: "COPY . ." },
    { level: "info", msg: "RUN pip install -r requirements.txt" },
    { level: "info", msg: "Collecting numpy==1.24.3" },
    { level: "info", msg: "Collecting langchain-core==0.1.8" },
    { level: "debug", msg: "Downloading langchain_core-0.1.8-py3-none-any.whl (178 kB)" },
    { level: "info", msg: "Collecting openai>=1.0.0" },
    { level: "info", msg: "Successfully installed all packages" },
    { level: "info", msg: "Pushing image to registry: jestico/agent:latest" },
    { level: "info", msg: "Digest: sha256:a3b4c5d6e7f8…" },
    { level: "info", msg: "Build complete. Creating Kubernetes Deployment…" },
    { level: "info", msg: "Deployment shikigami/agent-pod created." },
    { level: "info", msg: "Waiting for pod to become Ready…" },
    { level: "info", msg: "Pod is Running. Container started on port 8080." },
    { level: "info", msg: "Health-check passed — agent is live 🎉" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
    icon,
    label,
    value,
    mono = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-[#2e2924] bg-[#211e1a] p-4 flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1a1714] border border-[#2e2924] text-[#c96b3e]">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-[#7a6e66]">{label}</p>
                <p className={`mt-0.5 text-sm font-medium text-[#e8ddd5] truncate ${mono ? "font-mono" : ""}`}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };
    return (
        <button
            onClick={copy}
            className="p-1.5 rounded-lg text-[#7a6e66] hover:text-[#e8ddd5] hover:bg-[#2e2924] transition-colors cursor-pointer"
            title="Copy"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeploymentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [deployment, setDeployment] = useState<AgentDeployment | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [logs, setLogs] = useState<LogLine[]>([]);
    const [logsRunning, setLogsRunning] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const logIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const logIndexRef = useRef(0);

    // ── Load user ──────────────────────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/auth/github/me")
            .then((r) => r.ok ? r.json() : null)
            .then((d) => d && setUser(d.user))
            .catch(() => { });
    }, []);

    // ── Load deployment from localStorage ─────────────────────────────────────
    useEffect(() => {
        async function fetchDeployment() {
            try {
                const res = await fetch(`/api/deployments/${id}`);
                const deploymentRes = await res.json();
                const deployment = deploymentRes.deployment;
                console.log("deployment: ", deployment);

                if (deployment) {
                    setDeployment(deployment);
                } else {
                    setNotFound(true);
                }
            } catch {
                setNotFound(true);
            }
        }

        fetchDeployment();
    }, [id]);

    // ── Auto-stream build logs ─────────────────────────────────────────────────
    useEffect(() => {
        if (!deployment) return;
        if (deployment.status !== "building" && deployment.status !== "queued") return;

        setLogsRunning(true);
        logIndexRef.current = 0;

        logIntervalRef.current = setInterval(() => {
            const idx = logIndexRef.current;
            if (idx >= BUILD_LOG_SEQUENCE.length) {
                setLogsRunning(false);
                clearInterval(logIntervalRef.current!);
                return;
            }
            const entry = BUILD_LOG_SEQUENCE[idx];
            setLogs((prev) => [
                ...prev,
                { ...entry, ts: new Date().toISOString() },
            ]);
            logIndexRef.current += 1;
        }, 420);

        return () => clearInterval(logIntervalRef.current!);
    }, [deployment]);

    // ── Auto-scroll logs ───────────────────────────────────────────────────────
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // ─────────────────────────────────────────────────────────────────────────

    if (!deployment && !notFound) {
        return (
            <div className="min-h-screen bg-[#1a1714] flex flex-col">
                <Navbar user={user ?? undefined} />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#c96b3e]" />
                </div>
            </div>
        );
    }

    if (notFound || !deployment) {
        return (
            <div className="min-h-screen bg-[#1a1714] flex flex-col">
                <Navbar user={user ?? undefined} />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#211e1a] border border-[#2e2924] text-[#7a6e66]">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-[#e8ddd5]">Deployment not found</h2>
                        <p className="mt-1 text-sm text-[#7a6e66]">
                            No deployment with ID <span className="font-mono text-[#c96b3e]">{id}</span> exists locally.
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#211e1a] border border-[#2e2924] px-4 py-2 text-sm font-medium text-[#e8ddd5] hover:border-[#c96b3e]/40 transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const sc = statusConfig(deployment.status);

    return (
        <div className="min-h-screen bg-[#1a1714] text-[#e8ddd5] flex flex-col">
            <Navbar user={user ?? undefined} />

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8 space-y-8">

                {/* ── Breadcrumb ─────────────────────────────────────────────── */}
                <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[#7a6e66] mb-4">
                        <Link href="/dashboard" className="hover:text-[#e8ddd5] transition-colors">
                            Deployments
                        </Link>
                        <span>/</span>
                        <span className="text-[#c96b3e] truncate max-w-[200px]">{deployment.name}</span>
                    </div>

                    {/* ── Header ───────────────────────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#211e1a] border border-[#2e2924] text-[#c96b3e]">
                                <Box className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-xl font-semibold tracking-tight text-[#e8ddd5]">
                                        {deployment.name}
                                    </h1>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${sc.badge}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                        {sc.label}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-[#7a6e66] font-mono">{deployment.id}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <a
                                href={deployment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#2e2924] bg-[#211e1a] px-3.5 py-2 text-xs font-medium text-[#e8ddd5] hover:border-[#c96b3e]/40 transition-colors"
                            >
                                Visit
                                <ExternalLink className="h-3 w-3 text-[#7a6e66]" />
                            </a>
                            <button
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#c96b3e]/30 bg-[#c96b3e]/10 px-3.5 py-2 text-xs font-medium text-[#c96b3e] hover:bg-[#c96b3e]/15 transition-colors cursor-pointer"
                                title="Redeploy"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Redeploy
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Stat cards grid ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                        icon={<GitBranch className="h-4 w-4" />}
                        label="Branch"
                        value={deployment.branch}
                    />
                    <StatCard
                        icon={<GitCommit className="h-4 w-4" />}
                        label="Commit"
                        value={deployment.commitSha || "—"}
                        mono
                    />
                    <StatCard
                        icon={<Layers className="h-4 w-4" />}
                        label="Framework"
                        value={deployment.framework}
                    />
                    <StatCard
                        icon={<Clock className="h-4 w-4" />}
                        label="Deployed"
                        value={relativeTime(deployment.createdAt)}
                    />
                </div>

                {/* ── Two-column layout ──────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Build Logs ─────────────────────────────────────────── */}
                    <div className="lg:col-span-2 rounded-2xl border border-[#2e2924] bg-[#211e1a] overflow-hidden flex flex-col">
                        <div className="border-b border-[#2e2924] px-5 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Terminal className="h-4 w-4 text-[#c96b3e]" />
                                <h2 className="text-sm font-semibold text-[#e8ddd5]">Build Logs</h2>
                                {logsRunning && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                        Live
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 opacity-60">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto h-[400px] p-4 font-mono text-xs space-y-0.5 bg-[#181511]">
                            {logs.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-[#7a6e66]">
                                    {deployment.status === "ready" ? (
                                        <span>Build completed — logs archived.</span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c96b3e]" />
                                            Waiting for build logs…
                                        </span>
                                    )}
                                </div>
                            ) : (
                                logs.map((line, i) => (
                                    <div key={i} className="flex gap-3 leading-relaxed group">
                                        <span className="shrink-0 text-[#3e3730] group-hover:text-[#7a6e66] transition-colors select-none">
                                            {new Date(line.ts).toLocaleTimeString("en-US", { hour12: false })}
                                        </span>
                                        <span className={`shrink-0 w-10 uppercase text-[10px] font-bold tracking-wider ${logLevelColor(line.level)}`}>
                                            {line.level}
                                        </span>
                                        <span className="text-[#c4b8b0] break-all">{line.msg}</span>
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    {/* ── Right panel ────────────────────────────────────────── */}
                    <div className="space-y-4">

                        {/* Deployment URL */}
                        <div className="rounded-2xl border border-[#2e2924] bg-[#211e1a] p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="h-3.5 w-3.5 text-[#c96b3e]" />
                                <h3 className="text-xs font-semibold text-[#e8ddd5] uppercase tracking-wider">
                                    Endpoint
                                </h3>
                            </div>
                            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#2e2924] bg-[#1a1714] px-3 py-2">
                                <span className="font-mono text-[11px] text-[#c96b3e] truncate">
                                    {deployment.url}
                                </span>
                                <CopyButton text={deployment.url} />
                            </div>
                            <a
                                href={deployment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-[#2e2924] bg-[#1a1714] py-2 text-xs font-medium text-[#7a6e66] hover:text-[#e8ddd5] hover:border-[#c96b3e]/30 transition-colors"
                            >
                                Open endpoint
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>

                        {/* Repo info */}
                        <div className="rounded-2xl border border-[#2e2924] bg-[#211e1a] p-4 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="h-3.5 w-3.5 text-[#c96b3e]" />
                                <h3 className="text-xs font-semibold text-[#e8ddd5] uppercase tracking-wider">
                                    Source
                                </h3>
                            </div>

                            <div className="space-y-2">
                                {[
                                    { label: "Repository", value: deployment.repo },
                                    { label: "Branch", value: deployment.branch },
                                    { label: "Commit", value: deployment.commitSha || "—", mono: true },
                                ].map(({ label, value, mono }) => (
                                    <div key={label} className="flex items-start justify-between gap-2 py-1.5 border-b border-[#2e2924]/60 last:border-0">
                                        <span className="text-[11px] text-[#7a6e66]">{label}</span>
                                        <span className={`text-[11px] text-[#e8ddd5] text-right truncate max-w-[140px] ${mono ? "font-mono" : ""}`}>
                                            {value}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex items-start justify-between gap-2 py-1.5">
                                    <span className="text-[11px] text-[#7a6e66]">Created</span>
                                    <span className="text-[11px] text-[#e8ddd5]">
                                        {new Date(deployment.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status timeline */}
                        <div className="rounded-2xl border border-[#2e2924] bg-[#211e1a] p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Cpu className="h-3.5 w-3.5 text-[#c96b3e]" />
                                <h3 className="text-xs font-semibold text-[#e8ddd5] uppercase tracking-wider">
                                    Pipeline
                                </h3>
                            </div>

                            <ol className="relative space-y-3 ml-1">
                                {(
                                    [
                                        { step: "Queued", done: true },
                                        { step: "Building", done: deployment.status !== "queued" },
                                        { step: "Pushing", done: deployment.status === "ready" || deployment.status === "failed" },
                                        { step: "Live", done: deployment.status === "ready" },
                                    ] as const
                                ).map(({ step, done }, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${done
                                                ? "bg-[#c96b3e]/20 border-[#c96b3e]/40 text-[#c96b3e]"
                                                : "bg-[#1a1714] border-[#2e2924] text-[#7a6e66]"
                                                }`}
                                        >
                                            {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
                                        </span>
                                        <span className={`text-xs ${done ? "text-[#e8ddd5]" : "text-[#7a6e66]"}`}>
                                            {step}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>

                {/* ── Commit message banner (if present) ────────────────────── */}
                {deployment.commitMessage && (
                    <div className="rounded-2xl border border-[#2e2924] bg-[#211e1a] px-5 py-3.5 flex items-center gap-3">
                        <GitCommit className="h-4 w-4 shrink-0 text-[#7a6e66]" />
                        <p className="text-sm text-[#c4b8b0] truncate">{deployment.commitMessage}</p>
                    </div>
                )}

            </main>
        </div>
    );
}
