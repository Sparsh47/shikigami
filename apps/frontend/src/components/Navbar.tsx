"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShikigamiLogo } from "./ShikigamiLogo";
import { ProfileModal } from "./ProfileModal";
import { GitHubUser } from "@/types/user";
import { User, Settings, LogOut } from "lucide-react";

interface NavbarProps {
    user?: GitHubUser | null;
}

export function Navbar({ user: initialUser }: NavbarProps) {
    const [user, setUser] = useState<GitHubUser | null>(initialUser ?? null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Fetch user if not passed from parent
    useEffect(() => {
        if (initialUser !== undefined) {
            setUser(initialUser);
            return;
        }
        let isMounted = true;
        fetch("/api/auth/github/me")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => { if (isMounted && data) setUser(data.user); })
            .catch(() => {});
        return () => { isMounted = false; };
    }, [initialUser]);

    // Close dropdown on outside click
    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            router.push("/");
            router.refresh();
        } catch {
            setIsLoggingOut(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-lg dark:border-zinc-800/60 dark:bg-zinc-950/80">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">

                    {/* Brand */}
                    <Link
                        href={user ? "/dashboard" : "/"}
                        className="group flex items-center gap-2.5"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 ring-1 ring-zinc-200 transition-transform group-hover:scale-105 dark:ring-zinc-800">
                            <ShikigamiLogo className="h-5 w-5" />
                        </div>
                        <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Shikigami
                        </span>
                    </Link>

                    {/* Right: Avatar dropdown or login */}
                    <div className="flex items-center">
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                {/* Avatar trigger */}
                                <button
                                    onClick={() => setIsDropdownOpen((p) => !p)}
                                    aria-label="User menu"
                                    aria-expanded={isDropdownOpen}
                                    className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-transparent transition-all hover:ring-indigo-500/40 focus:outline-none"
                                >
                                    <img
                                        src={user.avatar_url}
                                        alt={user.login}
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                </button>

                                {/* Dropdown */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-zinc-100 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                                        {/* Identity header */}
                                        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                                            <img
                                                src={user.avatar_url}
                                                alt={user.login}
                                                className="h-7 w-7 rounded-full object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                                                    {user.name ?? user.login}
                                                </p>
                                                <p className="truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                                                    @{user.login}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    setIsProfileOpen(true);
                                                }}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                            >
                                                <User className="h-3.5 w-3.5" />
                                                View Profile
                                            </button>

                                            <Link
                                                href="/settings"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                                Settings
                                            </Link>

                                            <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />

                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                                disabled={isLoggingOut}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 disabled:opacity-50"
                                            >
                                                <LogOut className="h-3.5 w-3.5" />
                                                {isLoggingOut ? "Logging out…" : "Log out"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/api/auth/github"
                                className="rounded-lg bg-zinc-900 px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {user && (
                <ProfileModal
                    user={user}
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                />
            )}
        </>
    );
}
