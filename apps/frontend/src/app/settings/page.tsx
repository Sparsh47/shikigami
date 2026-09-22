"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GithubIcon } from "@/components/GithubIcon";
import { GitHubUser } from "@/types/user";
import {
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Lock,
    KeyRound,
} from "lucide-react";

export default function SettingsPage() {
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRevoking, setIsRevoking] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const router = useRouter();

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
                </div>
            </main>

            {/* Confirmation modal */}
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
