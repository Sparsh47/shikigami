"use client";

import React, { useEffect } from "react";
import { GitHubUser } from "@/types/user";
import {
    X,
    ExternalLink,
    Mail,
    MapPin,
    Building2,
    BookMarked,
    Users,
    UserCheck,
    Calendar,
    AtSign,
} from "lucide-react";

interface ProfileModalProps {
    user: GitHubUser;
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileModal({ user, isOpen, onClose }: ProfileModalProps) {
    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const formattedDate = user.created_at
        ? new Date(user.created_at).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
          })
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Card */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
                {/* Header Banner */}
                <div className="relative h-28 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    <button
                        onClick={onClose}
                        aria-label="Close profile modal"
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Avatar & Main Identity */}
                <div className="relative px-6 pb-6 pt-0">
                    <div className="-mt-14 mb-4 flex items-end justify-between">
                        <div className="relative">
                            <img
                                src={user.avatar_url}
                                alt={user.login}
                                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg dark:border-zinc-950"
                            />
                            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 dark:border-zinc-950" />
                        </div>

                        {user.html_url && (
                            <a
                                href={user.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                                GitHub Profile
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        )}
                    </div>

                    {/* Name & Login */}
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {user.name ?? user.login}
                        </h2>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            @{user.login}
                        </p>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                            {user.bio}
                        </p>
                    )}

                    {/* Quick Stats Grid */}
                    <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 text-center dark:border-zinc-800/80 dark:bg-zinc-900/50">
                        <div className="flex flex-col items-center justify-center p-1">
                            <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                <BookMarked className="h-3.5 w-3.5 text-indigo-500" />
                                Repos
                            </span>
                            <span className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                {user.public_repos}
                            </span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1 border-x border-zinc-200 dark:border-zinc-800">
                            <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                <Users className="h-3.5 w-3.5 text-purple-500" />
                                Followers
                            </span>
                            <span className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                {user.followers}
                            </span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-1">
                            <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                <UserCheck className="h-3.5 w-3.5 text-pink-500" />
                                Following
                            </span>
                            <span className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                {user.following}
                            </span>
                        </div>
                    </div>

                    {/* Details List */}
                    <div className="mt-5 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-zinc-400" />
                            <span>{user.email ? user.email : "No public email available"}</span>
                        </div>

                        {user.company && (
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-zinc-400" />
                                <span>{user.company}</span>
                            </div>
                        )}

                        {user.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-zinc-400" />
                                <span>{user.location}</span>
                            </div>
                        )}

                        {user.twitter_username && (
                            <div className="flex items-center gap-2">
                                <AtSign className="h-4 w-4 text-zinc-400" />
                                <span>@{user.twitter_username}</span>
                            </div>
                        )}

                        {formattedDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-zinc-400" />
                                <span>Joined GitHub {formattedDate}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
