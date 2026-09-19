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
            <header className="sticky top-0 z-40 w-full border-b border-[#2e2924] bg-[#1a1714]/90 backdrop-blur-md">
                <div className="mx-auto flex h-13 max-w-6xl items-center justify-between px-4 sm:px-6 py-3">

                    {/* Brand */}
                    <Link
                        href={user ? "/dashboard" : "/"}
                        className="group flex items-center gap-2.5"
                    >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c96b3e]/10 ring-1 ring-[#2e2924] transition-transform group-hover:scale-105">
                            <ShikigamiLogo className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-[#e8ddd5]">
                            Shikigami
                        </span>
                    </Link>

                    {/* Right */}
                    <div className="flex items-center">
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen((p) => !p)}
                                    aria-label="User menu"
                                    aria-expanded={isDropdownOpen}
                                    className="flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-transparent transition-all hover:ring-[#c96b3e]/40 focus:outline-none"
                                >
                                    <img
                                        src={user.avatar_url}
                                        alt={user.login}
                                        className="h-7 w-7 rounded-full object-cover"
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-[#2e2924] bg-[#211e1a] shadow-xl shadow-black/40">
                                        {/* Identity */}
                                        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[#2e2924]">
                                            <img
                                                src={user.avatar_url}
                                                alt={user.login}
                                                className="h-7 w-7 rounded-full object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-medium text-[#e8ddd5]">
                                                    {user.name ?? user.login}
                                                </p>
                                                <p className="truncate text-[10px] text-[#7a6e66]">
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
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-[#c4b8b0] transition-colors hover:bg-[#2e2924] hover:text-[#e8ddd5]"
                                            >
                                                <User className="h-3.5 w-3.5" />
                                                View Profile
                                            </button>

                                            <Link
                                                href="/settings"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-[#c4b8b0] transition-colors hover:bg-[#2e2924] hover:text-[#e8ddd5]"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                                Settings
                                            </Link>

                                            <div className="my-1 h-px bg-[#2e2924]" />

                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                                disabled={isLoggingOut}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-[#c96b3e]/80 transition-colors hover:bg-[#c96b3e]/10 hover:text-[#c96b3e] disabled:opacity-50"
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
                                className="rounded-lg bg-[#c96b3e] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#b85e34]"
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
