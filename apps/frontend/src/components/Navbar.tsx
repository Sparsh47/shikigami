"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ShikigamiLogo } from "./ShikigamiLogo";
import { ProfileModal } from "./ProfileModal";
import { GitHubUser } from "@/types/user";
import { User, Settings, LogOut, Sun, Moon, Monitor, ChevronDown } from "lucide-react";
import Image from "next/image";

interface NavbarProps {
    user?: GitHubUser | null;
}

const THEMES = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
] as const;

function ThemeDropdown() {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Avoid hydration mismatch
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    if (!mounted) return null;

    const current = THEMES.find((t) => t.value === theme) ?? THEMES[2];
    const CurrentIcon = current.icon;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((p) => !p)}
                aria-label="Change theme"
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] backdrop-blur-md px-2.5 py-1.5 text-xs font-medium text-[var(--text-body)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--text-heading)] shadow-sm"
            >
                <CurrentIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{current.label}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl border border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur-xl shadow-xl shadow-black/40 z-50">
                    <div className="p-1">
                        {THEMES.map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => { setTheme(value); setOpen(false); }}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors
                                    ${theme === value
                                        ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                                        : "text-[var(--text-body)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-heading)]"
                                    }`}
                            >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                {label}
                                {theme === value && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function Navbar({ user: initialUser }: NavbarProps) {
    const [user, setUser] = useState<GitHubUser | null>(initialUser ?? null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (initialUser !== undefined) {
            setUser(initialUser);
            return;
        }
        let isMounted = true;
        fetch("/api/auth/github/me")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => { if (isMounted && data) setUser(data.user); })
            .catch(() => { });
        return () => { isMounted = false; };
    }, [initialUser]);

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
            <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-md">
                <div className="mx-auto flex h-13 max-w-6xl items-center justify-between px-4 sm:px-6 py-3">

                    {/* Brand */}
                    <Link
                        href={user ? "/dashboard" : "/"}
                        className="group flex items-center gap-2.5"
                    >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-subtle)] ring-1 ring-[var(--border)] shadow-[0_0_8px_var(--accent-subtle)] transition-transform group-hover:scale-105">
                            <ShikigamiLogo className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-[var(--text-heading)]">
                            Shikigami
                        </span>
                    </Link>

                    {/* Right */}
                    <div className="flex items-center gap-2">
                        {/* Theme picker — always visible */}
                        <ThemeDropdown />

                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen((p) => !p)}
                                    aria-label="User menu"
                                    aria-expanded={isDropdownOpen}
                                    className="flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-transparent transition-all hover:ring-[var(--accent)]/50 focus:outline-none"
                                >
                                    <Image
                                        src={user.avatar_url}
                                        alt={user.login}
                                        className="h-7 w-7 rounded-full object-cover"
                                        width={200}
                                        height={200}
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur-xl shadow-xl shadow-black/40 z-50">
                                        {/* Identity */}
                                        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[var(--border)]">
                                            <img
                                                src={user.avatar_url}
                                                alt={user.login}
                                                className="h-7 w-7 rounded-full object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-medium text-[var(--text-heading)]">
                                                    {user.name ?? user.login}
                                                </p>
                                                <p className="truncate text-[10px] text-[var(--text-muted)]">
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
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-[var(--text-body)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-heading)]"
                                            >
                                                <User className="h-3.5 w-3.5" />
                                                View Profile
                                            </button>

                                            <Link
                                                href="/settings"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-[var(--text-body)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-heading)]"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                                Settings
                                            </Link>

                                            <div className="my-1 h-px bg-[var(--border)]" />

                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                                disabled={isLoggingOut}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
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
                                className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-heading)] transition-all hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] shadow-sm"
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
