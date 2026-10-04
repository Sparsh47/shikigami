"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GitHubUser } from "@/types/user";
import {
    Loader2,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Save,
    RotateCcw,
    CheckCircle2,
    AlertTriangle,
    Terminal,
    Tag,
    Rocket,
    GitBranch,
    GitCommit,
    ExternalLink,
    History,
    CircleDashed,
    XCircle,
    Settings,
} from "lucide-react";
import { AgentDeployment } from "@/types/repo";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnvVar {
    id: string;
    key: string;
    value: string;
    isSecret: boolean;
}

interface AgentSettings {
    agentName: string;
    envVars: EnvVar[];
}

type SaveState = "idle" | "saving" | "success" | "error";
type ActiveSection = "general" | "env-vars" | "deployments" | "danger";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
    return Math.random().toString(36).slice(2, 9);
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

function statusConfig(status: "ready" | "building" | "failed" | "queued") {
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

// ─── Env Var Row ──────────────────────────────────────────────────────────────

function EnvVarRow({
    envVar,
    onChange,
    onRemove,
    isVisible,
    onToggleVisibility,
}: {
    envVar: EnvVar;
    onChange: (id: string, field: "key" | "value", val: string) => void;
    onRemove: (id: string) => void;
    isVisible: boolean;
    onToggleVisibility: (id: string) => void;
}) {
    return (
        <div className="group grid grid-cols-[1fr_1fr_auto] border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-white/[0.015]">
            {/* Key cell */}
            <div className="flex items-center border-r border-[var(--border)]">
                <input
                    type="text"
                    placeholder="VARIABLE_NAME"
                    value={envVar.key}
                    onChange={(e) => onChange(envVar.id, "key", e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-xs font-mono text-[var(--text-heading)] placeholder-[var(--text-muted)]/50 outline-none"
                />
                {envVar.isSecret && (
                    <span className="mr-3 shrink-0 rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-amber-400/90">
                        secret
                    </span>
                )}
            </div>

            {/* Value cell */}
            <div className="flex items-center border-r border-[var(--border)]">
                <input
                    type={envVar.isSecret && !isVisible ? "password" : "text"}
                    placeholder={envVar.isSecret ? "encrypted" : "value"}
                    value={envVar.value}
                    onChange={(e) => onChange(envVar.id, "value", e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-xs font-mono text-[var(--text-body)] placeholder-[var(--text-muted)]/40 outline-none"
                />
                {envVar.isSecret && (
                    <button
                        type="button"
                        onClick={() => onToggleVisibility(envVar.id)}
                        className="mr-3 shrink-0 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
                        tabIndex={-1}
                    >
                        {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                )}
            </div>

            {/* Actions cell */}
            <div className="flex items-center justify-center w-12">
                <button
                    type="button"
                    onClick={() => onRemove(envVar.id)}
                    className="rounded p-1.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all cursor-pointer"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

function NavItem({
    icon,
    label,
    active,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${active
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-white/[0.04]"
                }`}
        >
            <span className={active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}>
                {icon}
            </span>
            {label}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeploymentSettingsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [user, setUser] = useState<GitHubUser | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeSection, setActiveSection] = useState<ActiveSection>("general");

    const [deployment, setDeployment] = useState<AgentDeployment | null>(null);
    const [allDeployments, setAllDeployments] = useState<AgentDeployment[]>([]);
    const [deploymentsLoading, setDeploymentsLoading] = useState(false);

    const [agentName, setAgentName] = useState("");
    const [envVars, setEnvVars] = useState<EnvVar[]>([]);
    const [visibleIds, setVisibleIds] = useState<Record<string, boolean>>({});

    const originalRef = useRef<AgentSettings>({ agentName: "", envVars: [] });

    const [saveState, setSaveState] = useState<SaveState>("idle");
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    // ── Load user ─────────────────────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/auth/github/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => d && setUser(d.user))
            .catch(() => { });
    }, []);

    const handleSectionChange = (section: ActiveSection) => {
        setActiveSection(section);
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("section", section);
            window.history.replaceState(null, "", url.toString());
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const section = params.get("section");
            if (section === "deployments" || section === "env-vars" || section === "danger" || section === "general") {
                setActiveSection(section);
            }
        }
    }, []);

    useEffect(() => {
        async function loadDeploymentInfo() {
            try {
                const res = await fetch(`/api/deployments/${id}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data.deployment) {
                    setDeployment(data.deployment);
                    setDeploymentsLoading(true);
                    const repoParam = data.deployment.repo ? `repo=${encodeURIComponent(data.deployment.repo)}` : "";
                    const agentParam = data.deployment.name ? `agentName=${encodeURIComponent(data.deployment.name)}` : "";
                    const query = [repoParam, agentParam].filter(Boolean).join("&");
                    const allRes = await fetch(`/api/deployments?${query}`);
                    if (allRes.ok) {
                        const allData = await allRes.json();
                        setAllDeployments(allData.deployments ?? []);
                    }
                }
            } catch (e) {
                console.warn("Failed to load repo deployments in settings:", e);
            } finally {
                setDeploymentsLoading(false);
            }
        }
        loadDeploymentInfo();
    }, [id]);

    // ── Load deployment settings ──────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/deployments/${id}/envs`);
                if (!res.ok) { setNotFound(true); return; }
                const data = await res.json();
                // Backend returns: { agent: agentName, envs: EnvVar[] }

                const initial: AgentSettings = {
                    agentName: data.agent ?? "",
                    envVars: (data.envs ?? []).map((v: any) => ({
                        id: uid(),
                        key: v.key,
                        value: v.value,
                        isSecret: v.isSecret ?? false,
                    })),
                };

                originalRef.current = structuredClone(initial);
                setAgentName(initial.agentName);
                setEnvVars(initial.envVars);
            } catch {
                setNotFound(true);
            } finally {
                setPageLoading(false);
            }
        }
        load();
    }, [id]);

    // ── Env var helpers ───────────────────────────────────────────────────────
    const addEnvVar = (presetKey?: string) => {
        const key = presetKey ?? "";
        setEnvVars((prev) => [
            ...prev,
            {
                id: uid(),
                key,
                value: "",
                isSecret: key.toLowerCase().includes("key") || key.toLowerCase().includes("secret"),
            },
        ]);
    };

    const removeEnvVar = (varId: string) =>
        setEnvVars((prev) => prev.filter((v) => v.id !== varId));

    const updateEnvVar = (varId: string, field: "key" | "value", val: string) => {
        setEnvVars((prev) =>
            prev.map((v) => {
                if (v.id !== varId) return v;
                const isSecret =
                    field === "key"
                        ? val.toLowerCase().includes("key") || val.toLowerCase().includes("secret")
                        : v.isSecret;
                return { ...v, [field]: val, isSecret };
            })
        );
    };

    const toggleVisibility = (varId: string) =>
        setVisibleIds((prev) => ({ ...prev, [varId]: !prev[varId] }));

    // ── Dirty check ───────────────────────────────────────────────────────────
    const isDirty =
        agentName !== originalRef.current.agentName ||
        JSON.stringify(envVars.map(({ key, value, isSecret }) => ({ key, value, isSecret }))) !==
        JSON.stringify(
            originalRef.current.envVars.map(({ key, value, isSecret }) => ({ key, value, isSecret }))
        );

    const handleDiscard = () => {
        setAgentName(originalRef.current.agentName);
        setEnvVars(structuredClone(originalRef.current.envVars));
        setVisibleIds({});
        setSaveState("idle");
        setSaveError(null);
    };

    // ── Save & redeploy ───────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!isDirty) return;
        setSaveState("saving");
        setSaveError(null);

        try {
            const res = await fetch(`/api/deployments/${id}/settings`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agentName: agentName.trim(),
                    envVars: envVars
                        .filter((v) => v.key.trim())
                        .map(({ key, value, isSecret }) => ({ key: key.trim(), value, isSecret })),
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || err.error || "Failed to save settings");
            }

            await fetch(`/api/deployments/${id}/redeploy`, { method: "POST" });

            originalRef.current = { agentName: agentName.trim(), envVars: structuredClone(envVars) };
            setSaveState("success");
            setTimeout(() => { setSaveState("idle"); router.push(`/deployments/${id}`); }, 1400);
        } catch (err: any) {
            setSaveState("error");
            setSaveError(err.message ?? "Something went wrong.");
        }
    };

    // ── Render guards ─────────────────────────────────────────────────────────
    if (pageLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
                <Navbar user={user ?? undefined} />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
                </div>
            </div>
        );
    }

    if (notFound) {
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

    // ── Sections ──────────────────────────────────────────────────────────────

    const generalSection = (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)]">
                <h2 className="text-sm font-semibold text-[var(--text-heading)]">Agent Name</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    The display name used across the platform and in your deployment URL.
                </p>
            </div>
            <div className="px-5 py-4">
                <input
                    id="agent-name"
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="my-ai-agent"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2.5 text-sm text-[var(--text-heading)] placeholder-[var(--text-muted)]/50 outline-none transition-all focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/15"
                />
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    Lowercase letters, numbers, and hyphens only. e.g.{" "}
                    <span className="font-mono text-[var(--text-body)]">my-langgraph-agent</span>
                </p>
            </div>
            <div className="px-5 py-3 border-t border-[var(--border)] bg-white/[0.015] flex items-center justify-between">
                <p className="text-[11px] text-[var(--text-muted)]">Changes will trigger a new deployment.</p>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!isDirty || saveState === "saving" || saveState === "success"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 cursor-pointer"
                >
                    {saveState === "saving" ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
                    ) : (
                        <><Save className="h-3 w-3" /> Save</>
                    )}
                </button>
            </div>
        </div>
    );

    const envVarsSection = (
        <div className="space-y-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--text-heading)]">Environment Variables</h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Injected into the container at runtime. Keys with{" "}
                            <span className="font-mono">key</span> or{" "}
                            <span className="font-mono">secret</span> are auto-encrypted.
                        </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                        {envVars.length} var{envVars.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_1fr_auto] border-b border-[var(--border)] bg-[var(--bg-base)]/60">
                    <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Name</div>
                    <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] border-l border-[var(--border)]">Value</div>
                    <div className="w-12" />
                </div>

                {/* Rows */}
                {envVars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)]">
                            <Terminal className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-medium text-[var(--text-muted)]">No environment variables</p>
                        <p className="text-[11px] text-[var(--text-muted)]/60">Add your first variable below</p>
                    </div>
                ) : (
                    envVars.map((v) => (
                        <EnvVarRow
                            key={v.id}
                            envVar={v}
                            onChange={updateEnvVar}
                            onRemove={removeEnvVar}
                            isVisible={!!visibleIds[v.id]}
                            onToggleVisibility={toggleVisibility}
                        />
                    ))
                )}

                {/* Footer toolbar */}
                <div className="border-t border-[var(--border)] px-4 py-3 flex flex-wrap items-center gap-2 bg-[var(--bg-base)]/40">
                    <button
                        type="button"
                        onClick={() => addEnvVar()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-body)] hover:border-[var(--accent)]/40 hover:text-[var(--text-heading)] transition-colors cursor-pointer"
                    >
                        <Plus className="h-3 w-3" />
                        Add variable
                    </button>
                    <span className="h-4 w-px bg-[var(--border)]" />
                    {["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "TAVILY_API_KEY"].map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => addEnvVar(preset)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-mono text-[var(--text-muted)] hover:border-amber-500/30 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                            <Plus className="h-2.5 w-2.5" />
                            {preset}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inline save banner */}
            {isDirty && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        {saveState === "error" ? (
                            <span className="text-xs text-rose-400">{saveError}</span>
                        ) : (
                            <span className="text-xs text-[var(--text-muted)]">You have unsaved changes</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDiscard}
                            disabled={saveState === "saving"}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--border)] transition-colors disabled:opacity-40 cursor-pointer"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Discard
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saveState === "saving" || saveState === "success"}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {saveState === "saving" ? (
                                <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
                            ) : saveState === "success" ? (
                                <><CheckCircle2 className="h-3 w-3" /> Saved</>
                            ) : (
                                <><Rocket className="h-3 w-3" /> Save &amp; Redeploy</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const dangerSection = (
        <div className="rounded-xl border border-rose-900/40 bg-[var(--bg-surface)] overflow-hidden">
            <div className="px-5 py-4 border-b border-rose-900/30">
                <h2 className="text-sm font-semibold text-rose-400">Danger Zone</h2>
                <p className="text-xs text-rose-400/60 mt-0.5">Irreversible actions. Proceed with caution.</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4">
                <div>
                    <p className="text-xs font-semibold text-[var(--text-heading)]">Delete this deployment</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Permanently removes the deployment, all pods, and history. Cannot be undone.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="shrink-0 inline-flex items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/50 transition-colors cursor-pointer"
                >
                    Delete deployment
                </button>
            </div>
        </div>
    );

    const deploymentsSection = (
        <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--text-heading)]">Deployments</h2>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            All deployments created for {deployment?.repo ? <span className="font-mono text-[var(--text-heading)]">{deployment.repo}</span> : "this repository"}.
                        </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-2.5 py-0.5 text-xs font-mono text-[var(--text-muted)]">
                        {allDeployments.length} deployment{allDeployments.length !== 1 ? "s" : ""}
                    </span>
                </div>

                <div className="divide-y divide-[var(--border)]">
                    {deploymentsLoading ? (
                        <div className="flex items-center justify-center py-12 text-[var(--text-muted)]">
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
                        </div>
                    ) : allDeployments.length === 0 ? (
                        <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                            No deployments found for this repository.
                        </div>
                    ) : (
                        allDeployments.map((d) => {
                            const sc = statusConfig(d.status);
                            const isCurrent = d.id === id;
                            return (
                                <div
                                    key={d.id}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.015] ${
                                        isCurrent ? "bg-[var(--accent)]/[0.03]" : ""
                                    }`}
                                >
                                    {/* Left: Status, name, commit, branch */}
                                    <div className="space-y-1.5 min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium border ${sc.badge}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                                {sc.label}
                                            </span>
                                            <Link
                                                href={`/deployments/${d.id}`}
                                                className="font-mono text-xs font-semibold text-[var(--text-heading)] hover:text-[var(--accent)] hover:underline truncate"
                                            >
                                                {d.id}
                                            </Link>
                                            {isCurrent && (
                                                <span className="rounded bg-[var(--accent)]/15 border border-[var(--accent)]/30 px-1.5 py-0.2 text-[9px] font-semibold text-[var(--accent)] uppercase tracking-wider">
                                                    Current
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
                                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                                <GitBranch className="h-3 w-3" />
                                                {d.branch}
                                            </span>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                                <GitCommit className="h-3 w-3" />
                                                {d.commitSha && d.commitSha !== "latest" ? d.commitSha.slice(0, 7) : "latest"}
                                            </span>
                                            {d.commitMessage && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[220px] text-[var(--text-body)]">
                                                        {d.commitMessage}
                                                    </span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>{relativeTime(d.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                                        {d.url && (
                                            <a
                                                href={d.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:border-[var(--accent)]/40 transition-colors"
                                            >
                                                Visit
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                        <Link
                                            href={`/deployments/${d.id}`}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-xs font-medium text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-elevated)] transition-colors"
                                        >
                                            View Logs
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] flex flex-col">
            <Navbar user={user ?? undefined} />

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-4">
                    <Link href="/dashboard" className="hover:text-[var(--text-heading)] transition-colors">
                        Deployments
                    </Link>
                    <span className="opacity-30">/</span>
                    <Link href={`/deployments/${id}`} className="hover:text-[var(--text-heading)] transition-colors font-mono">
                        {deployment?.name || `${id.slice(0, 8)}…`}
                    </Link>
                    <span className="opacity-30">/</span>
                    <span className="text-[var(--text-body)]">Settings</span>
                </div>

                {/* Vercel-style sub-navigation tabs */}
                <div className="flex items-center gap-6 border-b border-[var(--border)] mb-8 text-xs">
                    <Link
                        href={`/deployments/${id}`}
                        className="flex items-center gap-1.5 pb-2.5 font-medium border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
                    >
                        <Terminal className="h-3.5 w-3.5" />
                        Overview & Logs
                    </Link>
                    <button
                        type="button"
                        onClick={() => handleSectionChange("deployments")}
                        className={`flex items-center gap-1.5 pb-2.5 font-medium border-b-2 transition-colors cursor-pointer ${
                            activeSection === "deployments"
                                ? "border-[var(--accent)] text-[var(--text-heading)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                        }`}
                    >
                        <History className="h-3.5 w-3.5" />
                        Deployments
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSectionChange(activeSection === "deployments" ? "general" : activeSection)}
                        className={`flex items-center gap-1.5 pb-2.5 font-medium border-b-2 transition-colors cursor-pointer ${
                            activeSection !== "deployments"
                                ? "border-[var(--accent)] text-[var(--text-heading)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                        }`}
                    >
                        <Settings className="h-3.5 w-3.5" />
                        Settings
                    </button>
                </div>

                {/* Two-column layout */}
                <div className="flex gap-8">

                    {/* Sidebar */}
                    <aside className="hidden md:flex flex-col w-44 shrink-0 pt-0.5">
                        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]/60">
                            Settings
                        </p>
                        <nav className="space-y-0.5">
                            <NavItem icon={<Tag className="h-3.5 w-3.5" />} label="General" active={activeSection === "general"} onClick={() => handleSectionChange("general")} />
                            <NavItem icon={<Terminal className="h-3.5 w-3.5" />} label="Environment" active={activeSection === "env-vars"} onClick={() => handleSectionChange("env-vars")} />
                            <NavItem icon={<History className="h-3.5 w-3.5" />} label="Deployments" active={activeSection === "deployments"} onClick={() => handleSectionChange("deployments")} />
                            <NavItem icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Danger Zone" active={activeSection === "danger"} onClick={() => handleSectionChange("danger")} />
                        </nav>
                    </aside>

                    {/* Content */}
                    <div className="flex-1 min-w-0">

                        {/* Mobile tabs */}
                        <div className="flex md:hidden gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1 mb-5">
                            {(
                                [
                                    { key: "general", label: "General", icon: <Tag className="h-3 w-3" /> },
                                    { key: "env-vars", label: "Env Vars", icon: <Terminal className="h-3 w-3" /> },
                                    { key: "deployments", label: "Deployments", icon: <History className="h-3 w-3" /> },
                                    { key: "danger", label: "Danger", icon: <AlertTriangle className="h-3 w-3" /> },
                                ] as const
                            ).map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleSectionChange(tab.key)}
                                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors cursor-pointer ${activeSection === tab.key
                                            ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                                            : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Section heading */}
                        <div className="mb-5">
                            <h1 className="text-base font-semibold text-[var(--text-heading)]">
                                {activeSection === "general" && "General"}
                                {activeSection === "env-vars" && "Environment Variables"}
                                {activeSection === "deployments" && "Deployments"}
                                {activeSection === "danger" && "Danger Zone"}
                            </h1>
                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                                {activeSection === "general" && "Basic configuration for this deployment."}
                                {activeSection === "env-vars" && "Manage runtime secrets and configuration values."}
                                {activeSection === "deployments" && "All deployment runs and logs for this repository."}
                                {activeSection === "danger" && "Destructive actions that cannot be undone."}
                            </p>
                        </div>

                        {activeSection === "general" && generalSection}
                        {activeSection === "env-vars" && envVarsSection}
                        {activeSection === "deployments" && deploymentsSection}
                        {activeSection === "danger" && dangerSection}
                    </div>
                </div>
            </main>

            {/* Delete modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl shadow-black/70 overflow-hidden">
                        <div className="px-6 pt-6 pb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-900/40 bg-rose-500/10 text-rose-400">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                <h3 className="text-sm font-semibold text-[var(--text-heading)]">Delete deployment?</h3>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                This will permanently remove the deployment and all associated Kubernetes resources. This action{" "}
                                <span className="font-semibold text-[var(--text-body)]">cannot be undone</span>.
                            </p>
                        </div>

                        <div className="px-6 pb-4">
                            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                                Type <span className="font-mono font-semibold text-[var(--text-body)]">delete</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="delete"
                                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2.5 text-sm text-[var(--text-body)] placeholder-[var(--text-muted)]/40 outline-none transition-all focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/15"
                            />
                        </div>

                        <div className="flex items-center gap-2 justify-end border-t border-[var(--border)] px-6 py-4 bg-[var(--bg-base)]/40">
                            <button
                                type="button"
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                                className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--border)] transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleteConfirmText !== "delete"}
                                onClick={() => {
                                    // TODO: DELETE /api/deployments/:id → router.push("/dashboard")
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText("");
                                }}
                                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Delete deployment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
