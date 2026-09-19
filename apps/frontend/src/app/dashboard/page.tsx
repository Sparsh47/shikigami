"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { GitHubUser } from "@/types/user";
import {
    BookMarked,
    Users,
    UserCheck,
    ExternalLink,
    Terminal,
    Sparkles,
    Loader2,
} from "lucide-react";

export default function Dashboard() {
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [loading, setLoading] = useState(true);

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
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 max-w-md w-full">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            Authentication Required
                        </h2>
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                            Please sign in with your GitHub account to access your Shikigami dashboard.
                        </p>
                        <Link
                            href="/api/auth/github"
                            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            Sign In with GitHub
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col">
            <Navbar user={user} />

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
                {/* Hero Profile Overview Card */}
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent blur-2xl pointer-events-none" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <img
                                    src={user.avatar_url}
                                    alt={user.login}
                                    className="h-20 w-20 rounded-2xl border-2 border-indigo-500/20 object-cover shadow-md"
                                />
                                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                        Welcome, {user.name ?? user.login}
                                    </h1>
                                    <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                        <Sparkles className="h-3 w-3" />
                                        Ready
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                    @{user.login} • {user.email ?? "No public email"}
                                </p>
                                {user.bio && (
                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 max-w-xl">
                                        {user.bio}
                                    </p>
                                )}
                            </div>
                        </div>

                        {user.html_url && (
                            <a
                                href={user.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            >
                                Open GitHub
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Repositories
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                <BookMarked className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold tracking-tight">
                            {user.public_repos}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Available for deployment
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Followers
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold tracking-tight">
                            {user.followers}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            GitHub network
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Following
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400">
                                <UserCheck className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold tracking-tight">
                            {user.following}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Accounts followed
                        </p>
                    </div>
                </div>

                {/* Build Engine Activity Preview */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Terminal className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-base font-semibold">
                                Shikigami Container Engine
                            </h2>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Cluster Connected
                        </span>
                    </div>

                    <div className="py-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <BookMarked className="h-6 w-6 text-zinc-400" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            No Active Builds
                        </h3>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                            Kaniko build jobs submitted via the API will stream their build status, container logs, and image registry tags here.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}