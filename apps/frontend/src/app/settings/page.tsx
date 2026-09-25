"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GithubIcon } from "@/components/GithubIcon";
import { DockerIcon } from "@/components/DockerIcon";
import { GitHubUser } from "@/types/user";
import {
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Lock,
    KeyRound,
    Eye,
    EyeOff,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    User,
    Unlink,
} from "lucide-react";

export default function SettingsPage() {
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRevoking, setIsRevoking] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const router = useRouter();

    // Docker PAT state
    const [dockerUsername, setDockerUsername] = useState("");
    const [dockerPat, setDockerPat] = useState("");
    const [showPat, setShowPat] = useState(false);
    const [isSavingPat, setIsSavingPat] = useState(false);
    const [patError, setPatError] = useState<string | null>(null);
    const [patSuccess, setPatSuccess] = useState(false);
    const [connectedDockerUsername, setConnectedDockerUsername] = useState<string | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [isDisconnectingDocker, setIsDisconnectingDocker] = useState(false);

    useEffect(() => {
        async function loadUser() {
            try {
                const res = await fetch("/api/auth/github/me");
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    router.push("/");
                }
            } catch (err) {
                console.error("Failed to load user in Settings:", err);
            } finally {
                setLoading(false);
            }
        }
        loadUser();

        // Check if Docker is already connected via cookie
        const cookies = document.cookie.split(";").reduce<Record<string, string>>((acc, c) => {
            const [k, v] = c.trim().split("=");
            if (k && v) acc[k] = decodeURIComponent(v);
            return acc;
        }, {});
        if (cookies["docker_username"]) {
            setConnectedDockerUsername(cookies["docker_username"]);
        }
    }, [router]);

    const handleRevoke = async () => {
        try {
            setIsRevoking(true);
            const res = await fetch("/api/auth/github/revoke", { method: "POST" });
            if (res.ok) {
                router.push("/");
                router.refresh();
            } else {
                alert("Failed to revoke access. Please try again.");
                setIsRevoking(false);
            }
        } catch (err) {
            console.error("Revoke error:", err);
            alert("An error occurred while revoking access.");
            setIsRevoking(false);
        }
    };

    const handleSavePat = async (e: React.FormEvent) => {
        e.preventDefault();
        setPatError(null);
        setPatSuccess(false);

        if (!dockerUsername.trim()) {
            setPatError("Docker Hub username is required.");
            return;
        }
        if (!dockerPat.trim()) {
            setPatError("Personal Access Token is required.");
            return;
        }

        try {
            setIsSavingPat(true);
            const res = await fetch("/api/auth/docker/pat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: dockerUsername.trim(), token: dockerPat.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setPatError(data.error || "Failed to connect Docker Hub.");
                return;
            }
            setConnectedDockerUsername(data.username);
            setPatSuccess(true);
            setDockerUsername("");
            setDockerPat("");
            setTimeout(() => setPatSuccess(false), 3000);
        } catch (err) {
            setPatError("An unexpected error occurred. Please try again.");
        } finally {
            setIsSavingPat(false);
        }
    };

    const handleDisconnectDocker = async () => {
        try {
            setIsDisconnectingDocker(true);
            await fetch("/api/auth/docker/pat", { method: "DELETE" });
            setConnectedDockerUsername(null);
        } catch {
            // ignore
        } finally {
            setIsDisconnectingDocker(false);
        }
    };

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

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] flex flex-col">
            <Navbar user={user} />

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">

                {/* Page title */}
                <div className="mb-8">
                    <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                        Account
                    </p>
                    <h1 className="text-2xl font-semibold text-[var(--text-heading)]">Settings</h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Manage your connected accounts, authorizations, and security settings.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* GitHub Integration Card */}
                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
                        {/* Card header */}
                        <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-heading)]">
                                    <GithubIcon className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--text-heading)]">
                                        GitHub Authorization
                                    </h2>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Connected as{" "}
                                        <span className="font-medium text-[var(--text-body)]">@{user.login}</span>
                                    </p>
                                </div>
                            </div>

                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-xs font-medium text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Connected
                            </span>
                        </div>

                        {/* Card body */}
                        <div className="px-6 py-5 space-y-5">
                            {/* Scopes */}
                            <div>
                                <h3 className="text-xs font-medium text-[var(--text-body)] mb-2">
                                    Active OAuth Scopes
                                </h3>
                                <p className="text-xs text-[var(--text-muted)] mb-3">
                                    Shikigami is authorized with these scopes to automate your build deployments:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: "read:user", Icon: KeyRound },
                                        { label: "user:email", Icon: Lock },
                                        { label: "repo", Icon: GithubIcon },
                                    ].map(({ label, Icon }) => (
                                        <span
                                            key={label}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-2.5 py-1 text-xs font-mono text-[var(--text-body)]"
                                        >
                                            <Icon className="h-3 w-3 text-[var(--accent)]" />
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Danger zone */}
                            <div className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-1.5">
                                            <ShieldAlert className="h-4 w-4" />
                                            Revoke GitHub Access
                                        </h4>
                                        <p className="mt-1 text-xs text-rose-400/70 max-w-lg">
                                            This will disconnect Shikigami from your GitHub account,
                                            invalidate the OAuth token, and clear your session.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmModal(true)}
                                        disabled={isRevoking}
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-500 focus:outline-none disabled:opacity-50 shrink-0"
                                    >
                                        {isRevoking ? (
                                            <>
                                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                Revoking…
                                            </>
                                        ) : (
                                            "Revoke Access"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Docker Hub Integration Card */}
                    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
                        {/* Card header */}
                        <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-base)] border border-[var(--border)] text-[var(--accent)]">
                                    <DockerIcon className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--text-heading)]">
                                        Docker Hub Registry
                                    </h2>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Container registry for pushing and pulling deployment images
                                    </p>
                                </div>
                            </div>

                            {connectedDockerUsername ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-xs font-medium text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Connected
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                                    Not Connected
                                </span>
                            )}
                        </div>

                        {/* Card body */}
                        <div className="px-6 py-5 space-y-5">

                            {connectedDockerUsername ? (
                                /* ── Connected state ── */
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-emerald-400/70">Authenticated as</p>
                                            <p className="text-sm font-semibold text-emerald-300 truncate">
                                                {connectedDockerUsername}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)]/50 px-4 py-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-medium text-[var(--text-body)]">Disconnect Docker Hub</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                                    Removes the stored PAT. You can reconnect anytime.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleDisconnectDocker}
                                                disabled={isDisconnectingDocker}
                                                className="inline-flex items-center gap-1.5 justify-center whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-50 shrink-0 cursor-pointer"
                                            >
                                                {isDisconnectingDocker ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Unlink className="h-3.5 w-3.5" />
                                                )}
                                                Disconnect
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* ── Not connected state ── */
                                <div className="space-y-5">
                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                        Connect your Docker Hub account using a Personal Access Token (PAT) to publish
                                        build artifacts, automate image distribution, and access private repositories.
                                    </p>

                                    {/* How to get a PAT — collapsible */}
                                    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setShowInstructions(!showInstructions)}
                                            className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-[var(--text-body)] hover:bg-[var(--bg-base)]/60 transition-colors cursor-pointer"
                                        >
                                            <span className="flex items-center gap-2">
                                                <KeyRound className="h-3.5 w-3.5 text-[var(--accent)]" />
                                                How to create a Docker Hub Personal Access Token
                                            </span>
                                            {showInstructions ? (
                                                <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                            ) : (
                                                <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                            )}
                                        </button>

                                        {showInstructions && (
                                            <div className="border-t border-[var(--border)] bg-[var(--bg-base)]/40 px-4 py-4 space-y-4">
                                                <ol className="space-y-3">
                                                    {[
                                                        {
                                                            step: "1",
                                                            title: "Open Docker Hub Security settings",
                                                            desc: "Go to hub.docker.com → click your avatar → Account Settings → Security.",
                                                        },
                                                        {
                                                            step: "2",
                                                            title: "Generate a new token",
                                                            desc: "Click New Access Token. Give it a memorable description (e.g. \"Shikigami CI\") so you can identify it later.",
                                                        },
                                                        {
                                                            step: "3",
                                                            title: "Choose Read & Write permissions",
                                                            desc: "Select Read & Write (or Read, Write & Delete for full control). Shikigami needs write access to push images.",
                                                        },
                                                        {
                                                            step: "4",
                                                            title: "Copy the token immediately",
                                                            desc: "Docker Hub shows the token only once. Copy it now and paste it below.",
                                                        },
                                                    ].map(({ step, title, desc }) => (
                                                        <li key={step} className="flex gap-3">
                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[10px] font-bold text-[var(--accent)] mt-0.5">
                                                                {step}
                                                            </span>
                                                            <div>
                                                                <p className="text-xs font-medium text-[var(--text-body)]">{title}</p>
                                                                <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{desc}</p>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ol>

                                                <a
                                                    href="https://app.docker.com/settings/personal-access-tokens/create"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline"
                                                >
                                                    Open Docker Hub token page
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* PAT form */}
                                    <form onSubmit={handleSavePat} className="space-y-3">
                                        {/* Username */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="docker-username"
                                                className="block text-xs font-medium text-[var(--text-body)]"
                                            >
                                                Docker Hub Username
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                                                <input
                                                    id="docker-username"
                                                    type="text"
                                                    autoComplete="username"
                                                    placeholder="yourDockerUsername"
                                                    value={dockerUsername}
                                                    onChange={(e) => { setDockerUsername(e.target.value); setPatError(null); }}
                                                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-body)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                                                />
                                            </div>
                                        </div>

                                        {/* PAT */}
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor="docker-pat"
                                                className="block text-xs font-medium text-[var(--text-body)]"
                                            >
                                                Personal Access Token
                                            </label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                                                <input
                                                    id="docker-pat"
                                                    type={showPat ? "text" : "password"}
                                                    autoComplete="current-password"
                                                    placeholder="dckr_pat_••••••••••••••••••••••"
                                                    value={dockerPat}
                                                    onChange={(e) => { setDockerPat(e.target.value); setPatError(null); }}
                                                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] py-2.5 pl-9 pr-11 text-sm text-[var(--text-body)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 font-mono"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPat(!showPat)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors cursor-pointer"
                                                    tabIndex={-1}
                                                    aria-label={showPat ? "Hide token" : "Show token"}
                                                >
                                                    {showPat ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                                Your token is validated against Docker Hub and stored securely in an httpOnly cookie. It is never logged or shared.
                                            </p>
                                        </div>

                                        {/* Error */}
                                        {patError && (
                                            <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/8 px-3 py-2.5">
                                                <AlertTriangle className="h-3.5 w-3.5 text-rose-400 mt-0.5 shrink-0" />
                                                <p className="text-xs text-rose-400">{patError}</p>
                                            </div>
                                        )}

                                        {/* Success */}
                                        {patSuccess && (
                                            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2.5">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                                <p className="text-xs text-emerald-400">Docker Hub connected successfully!</p>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isSavingPat || !dockerUsername.trim() || !dockerPat.trim()}
                                            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-xs font-semibold text-zinc-950 shadow-sm transition-all hover:bg-[var(--accent-hover)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isSavingPat ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    Validating…
                                                </>
                                            ) : (
                                                <>
                                                    <DockerIcon className="h-4 w-4" />
                                                    Connect Docker Hub
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* GitHub Revoke confirmation modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl shadow-black/60">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-900/30">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-[var(--text-heading)]">
                                    Revoke GitHub Authorization?
                                </h3>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                    This action cannot be undone without re-authorizing.
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                            Are you sure you want to disconnect your account? You will be logged out and will need to authorize Shikigami again to access repositories and build triggers.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isRevoking}
                                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text-heading)] transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    handleRevoke();
                                }}
                                disabled={isRevoking}
                                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
                            >
                                Yes, Revoke Access
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
