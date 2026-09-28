"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GitHubUser } from "@/types/user";
import { AgentDeployment } from "@/types/repo";
import {
    GitBranch,
    GitCommit,
    ExternalLink,
    Loader2,
    RefreshCw,
    Terminal,
    CheckCircle2,
    XCircle,
    CircleDashed,
    Globe,
    Copy,
    Check,
    AlertTriangle,
    Layers,
    Settings,
} from "lucide-react";

type DeployStatus = "ready" | "building" | "failed" | "queued";

interface LogLine {
    ts: string;
    level: "info" | "warn" | "error" | "debug";
    msg: string;
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
        case "warn": return "text-amber-300";
        case "info": return "text-sky-400";
        case "debug": return "text-slate-400";
    }
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
            }}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
            title="Copy"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    );
}

// Shared card section header — matches settings page section headers exactly
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
            <span className="text-[var(--accent)]">{icon}</span>
            <h2 className="text-sm font-semibold text-[var(--text-heading)]">{title}</h2>
        </div>
    );
}

// Key/value row — same as settings page source rows
function InfoRow({ label, value, mono = false, children }: {
    label: string;
    value?: string;
    mono?: boolean;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 py-2 border-b border-[var(--border)]/60 last:border-0">
            <span className="text-[11px] text-[var(--text-muted)] shrink-0">{label}</span>
            {children ?? (
                <span className={`text-[11px] text-[var(--text-heading)] text-right truncate max-w-[200px] ${mono ? "font-mono" : ""}`}>
                    {value}
                </span>
            )}
        </div>
    );
}

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

    useEffect(() => {
        fetch("/api/auth/github/me")
            .then((r) => r.ok ? r.json() : null)
            .then((d) => d && setUser(d.user))
            .catch(() => { });
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function fetchDeployment() {
            try {
                const res = await fetch(`/api/deployments/${id}`);
                const deploymentRes = await res.json();
                const d = deploymentRes.deployment;

                if (d && isMounted) {
                    setDeployment((prev) => {
                        if (!prev) return d;
                        if (
                            prev.id === d.id &&
                            prev.status === d.status &&
                            prev.updatedAt === d.updatedAt &&
                            prev.url === d.url
                        ) {
                            return prev;
                        }
                        return d;
                    });
                } else if (isMounted) {
                    setNotFound(true);
                }
            } catch {
                if (isMounted) setNotFound(true);
            }
        }

        fetchDeployment();

        const interval = setInterval(() => {
            fetchDeployment();
        }, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [id]);

    const handleRedeploy = async () => {
        if (!deployment) return;
        try {
            const res = await fetch(`/api/deployments/${deployment.id}/redeploy`, {
                method: "POST",
            });
            if (res.ok) {
                const data = await res.json();
                window.location.href = `/deployments/${data.deploymentId}`;
            }
        } catch (e) {
            console.error("Failed to redeploy", e);
        }
    };

    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!deployment) return;

        if (deployment.status === "ready" || deployment.status === "failed") {
            setLogsRunning(false);
            return;
        }

        if (eventSourceRef.current) return;

        setLogsRunning(true);
        const sse = new EventSource(`http://localhost:8080/api/deployments/${deployment.id}/logs`);
        eventSourceRef.current = sse;

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "event") {
                    setLogs((prev) => [
                        ...prev,
                        {
                            ts: data.timestamp || new Date().toISOString(),
                            level: data.status.includes("FAILED") ? "error" : data.status.includes("POLLING") ? "debug" : "info",
                            msg: `[EVENT] ${data.message}`
                        }
                    ]);
                } else if (data.type === "log" || data.type === "syslog") {
                    setLogs((prev) => [
                        ...prev,
                        {
                            ts: new Date().toISOString(),
                            level: "info",
                            msg: data.message
                        }
                    ]);
                }
            } catch (e) {
                console.error("Failed to parse SSE message", e);
            }
        };

        sse.onerror = () => {
            sse.close();
            eventSourceRef.current = null;
            setLogsRunning(false);
        };

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [deployment?.id, deployment?.status]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [logs]);

    // ── Guards ──────────────────────────────────────────────────────────────────

    if (!deployment && !notFound) {
        return (
            <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
                <Navbar user={user ?? undefined} />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
                </div>
            </div>
        );
    }

    if (notFound || !deployment) {
        return (
            <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
                <Navbar user={user ?? undefined} />
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
                        <AlertTriangle className="h-5 w-5 text-[var(--text-muted)]" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[var(--text-heading)]">Deployment not found</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            The deployment <span className="font-mono text-[var(--accent)]">{id}</span> doesn&apos;t exist.
                        </p>
                    </div>
                    <Link href="/dashboard" className="text-xs text-[var(--accent)] hover:underline">
                        ← Back to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const sc = statusConfig(deployment.status);

    // Pipeline steps
    const pipelineSteps: { step: string; state: "done" | "current" | "upcoming" | "failed" }[] = [
        { step: "Queued", state: deployment.status === "queued" ? "current" : "done" },
        {
            step: "Building",
            state: deployment.status === "queued"
                ? "upcoming"
                : deployment.status === "building"
                    ? "current"
                    : "done",
        },
        deployment.status === "failed"
            ? { step: "Failed", state: "failed" }
            : { step: "Ready", state: deployment.status === "ready" ? "done" : "upcoming" },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] flex flex-col">
            <Navbar user={user ?? undefined} />

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-6">
                    <Link href="/dashboard" className="hover:text-[var(--text-heading)] transition-colors">
                        Deployments
                    </Link>
                    <span className="opacity-30">/</span>
                    <span className="text-[var(--text-body)] font-mono truncate max-w-[160px]">{deployment.name}</span>
                </div>

                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-base font-semibold text-[var(--text-heading)]">{deployment.name}</h1>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${sc.badge}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                {sc.label}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)] font-mono">{deployment.id}</p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <a
                            href={deployment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                        >
                            <ExternalLink className="h-3 w-3" />
                            Visit
                        </a>
                        <button
                            onClick={handleRedeploy}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-zinc-950 hover:border-[var(--accent)] transition-colors cursor-pointer"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Redeploy
                        </button>
                        <Link
                            href={`/deployments/${id}/settings`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                            <Settings className="h-3 w-3" />
                            Settings
                        </Link>
                    </div>
                </div>

                {/* Main two-column layout — mirrors settings page */}
                <div className="flex gap-8 items-start">

                    {/* Left sidebar — info cards */}
                    <aside className="hidden md:flex flex-col w-56 shrink-0 gap-3">

                        {/* Endpoint card */}
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                            <SectionHeader icon={<Globe className="h-3.5 w-3.5" />} title="Endpoint" />
                            <div className="px-4 py-3 space-y-2">
                                <div className="flex items-center justify-between gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-2.5 py-2">
                                    <span className="font-mono text-[10px] text-[var(--accent)] truncate">{deployment.url || "—"}</span>
                                    {deployment.url && <CopyButton text={deployment.url} />}
                                </div>
                                {deployment.url && (
                                    <a
                                        href={deployment.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] py-1.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:border-[var(--accent)]/40 transition-colors"
                                    >
                                        Open
                                        <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Source card */}
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                            <SectionHeader icon={<GitBranch className="h-3.5 w-3.5" />} title="Source" />
                            <div className="px-4 py-2">
                                <InfoRow label="Repo" value={deployment.repo} />
                                <InfoRow label="Branch" value={deployment.branch} />
                                <InfoRow label="Commit" value={deployment.commitSha ? deployment.commitSha.slice(0, 7) : "—"} mono />
                                <InfoRow label="Framework" value={deployment.framework} />
                                <InfoRow label="Deployed" value={relativeTime(deployment.createdAt)} />
                            </div>
                        </div>

                        {/* Pipeline card */}
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                            <SectionHeader icon={<Layers className="h-3.5 w-3.5" />} title="Pipeline" />
                            <ol className="px-4 py-3 space-y-2.5">
                                {pipelineSteps.map(({ step, state }, i) => (
                                    <li key={step} className="flex items-center gap-2.5">
                                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${state === "done"
                                            ? "bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)]"
                                            : state === "current"
                                                ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                                                : state === "failed"
                                                    ? "bg-red-500/15 border-red-500/40 text-red-400"
                                                    : "bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-muted)]"
                                            }`}>
                                            {state === "done" && <Check className="h-2.5 w-2.5" />}
                                            {state === "current" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                                            {state === "failed" && <XCircle className="h-2.5 w-2.5" />}
                                            {state === "upcoming" && (i + 1)}
                                        </span>
                                        <span className={`text-xs ${state === "failed" ? "text-red-400 font-medium"
                                            : state === "current" ? "text-amber-400 font-medium"
                                                : state === "done" ? "text-[var(--text-heading)]"
                                                    : "text-[var(--text-muted)]"
                                            }`}>
                                            {step}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </aside>

                    {/* Main content — build logs */}
                    <div className="flex-1 min-w-0 space-y-3">

                        {/* Commit message banner */}
                        {deployment.commitMessage && (
                            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3">
                                <GitCommit className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                                <p className="text-xs text-[var(--text-body)] truncate">{deployment.commitMessage}</p>
                            </div>
                        )}

                        {/* Build logs card — matches settings card style with themed header */}
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                                <div className="flex items-center gap-2.5">
                                    <Terminal className="h-3.5 w-3.5 text-[var(--accent)]" />
                                    <h2 className="text-sm font-semibold text-[var(--text-heading)]">Build Logs</h2>
                                    {logsRunning && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                            Live
                                        </span>
                                    )}
                                </div>
                                {/* macOS traffic lights */}
                                <div className="flex items-center gap-1.5 opacity-50">
                                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                                </div>
                            </div>

                            {/* Terminal body — always dark */}
                            <div className="overflow-y-auto h-[420px] p-4 font-mono text-xs space-y-0.5 bg-[#0c0b09]">
                                {logs.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        {deployment.status === "ready" ? (
                                            <span className="text-slate-500">Build completed — logs archived.</span>
                                        ) : deployment.status === "failed" ? (
                                            <span className="text-red-400/70">Build failed.</span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-slate-500">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
                                                Waiting for build logs…
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    logs.map((line, i) => (
                                        <div key={i} className="flex gap-3 leading-relaxed group">
                                            <span className="shrink-0 text-slate-700 group-hover:text-slate-500 transition-colors select-none tabular-nums">
                                                {new Date(line.ts).toLocaleTimeString("en-US", { hour12: false })}
                                            </span>
                                            <span className={`shrink-0 w-10 uppercase text-[10px] font-bold tracking-wider ${logLevelColor(line.level)}`}>
                                                {line.level}
                                            </span>
                                            <span className="text-slate-200 break-all">{line.msg}</span>
                                        </div>
                                    ))
                                )}
                                <div ref={logsEndRef} />
                            </div>
                        </div>

                        {/* Mobile-only: source + pipeline info */}
                        <div className="md:hidden grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                                <SectionHeader icon={<GitBranch className="h-3.5 w-3.5" />} title="Source" />
                                <div className="px-4 py-2">
                                    <InfoRow label="Branch" value={deployment.branch} />
                                    <InfoRow label="Framework" value={deployment.framework} />
                                    <InfoRow label="Deployed" value={relativeTime(deployment.createdAt)} />
                                </div>
                            </div>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                                <SectionHeader icon={<Layers className="h-3.5 w-3.5" />} title="Pipeline" />
                                <ol className="px-4 py-3 space-y-2.5">
                                    {pipelineSteps.map(({ step, state }, i) => (
                                        <li key={step} className="flex items-center gap-2">
                                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${state === "done" ? "bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)]"
                                                : state === "current" ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                                                    : state === "failed" ? "bg-red-500/15 border-red-500/40 text-red-400"
                                                        : "bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-muted)]"
                                                }`}>
                                                {state === "done" && <Check className="h-2 w-2" />}
                                                {state === "current" && <Loader2 className="h-2 w-2 animate-spin" />}
                                                {state === "failed" && <XCircle className="h-2 w-2" />}
                                                {state === "upcoming" && (i + 1)}
                                            </span>
                                            <span className={`text-[11px] ${state === "failed" ? "text-red-400 font-medium"
                                                : state === "current" ? "text-amber-400 font-medium"
                                                    : state === "done" ? "text-[var(--text-heading)]"
                                                        : "text-[var(--text-muted)]"
                                                }`}>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
