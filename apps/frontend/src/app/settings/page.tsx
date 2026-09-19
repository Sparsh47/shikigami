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
            const res = await fetch("/api/auth/github/revoke", {
                method: "POST",
            });
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
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col">
            <Navbar user={user} />

            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Settings
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Manage your connected accounts, authorizations, and security settings.
                    </p>
                </div>

                {/* Settings Content */}
                <div className="space-y-6">
                    {/* GitHub Integration Card */}
                    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="border-b border-zinc-100 p-6 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                                        <GithubIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold">
                                            GitHub Authorization
                                        </h2>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            Connected as <span className="font-medium text-zinc-900 dark:text-zinc-200">@{user.login}</span>
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Connected
                                </span>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                        Active Permissions & Scopes
                                    </h3>
                                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                        Shikigami is authorized with the following OAuth scopes to automate your build deployments:
                                    </p>
                                    <div className="mt-2.5 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                                            <KeyRound className="h-3 w-3 text-indigo-500" />
                                            read:user
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                                            <Lock className="h-3 w-3 text-purple-500" />
                                            user:email
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                                            <GithubIcon className="h-3 w-3 text-pink-500" />
                                            repo
                                        </span>
                                    </div>
                                </div>

                                {/* Danger Zone: Revoke Access */}
                                <div className="mt-6 rounded-xl border border-red-200 bg-red-50/40 p-4 dark:border-red-900/40 dark:bg-red-950/10">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                                                <ShieldAlert className="h-4 w-4 text-red-500" />
                                                Revoke GitHub Access
                                            </h4>
                                            <p className="mt-1 text-xs text-red-700/80 dark:text-red-400/80 max-w-lg">
                                                This will disconnect Shikigami from your GitHub account, invalidate the OAuth token directly with GitHub, and clear your session.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmModal(true)}
                                            disabled={isRevoking}
                                            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:hover:bg-red-500"
                                        >
                                            {isRevoking ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Revoking...
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
                </div>
            </main>

            {/* Confirmation Dialog */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    Revoke GitHub Authorization?
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    This action will revoke the application grant.
                                </p>
                            </div>
                        </div>

                        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                            Are you sure you want to disconnect your account? You will be logged out and will need to authorize Shikigami again to access repositories and build triggers.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={isRevoking}
                                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
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
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
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
