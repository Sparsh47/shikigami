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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur-xl shadow-2xl shadow-black/60">
                {/* Header background with gradient */}
                <div
                    className="h-24 relative flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #1a1714 0%, #2a1f18 50%, #1a1714 100%)" }}
                >
                    {/* Subtle glow */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{ background: "radial-gradient(ellipse at 30% 50%, var(--accent)44 0%, transparent 70%)" }}
                    />

                    <button
                        onClick={onClose}
                        aria-label="Close profile"
                        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--border)]/80 text-[var(--text-muted)] backdrop-blur-sm transition-colors hover:bg-[var(--border)] hover:text-[var(--text-heading)]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 pt-0">
                    {/* Avatar row */}
                    <div className="-mt-12 mb-4 flex items-end justify-between">
                        <div className="relative">
                            <img
                                src={user.avatar_url}
                                alt={user.login}
                                className="h-20 w-20 rounded-2xl border-4 border-[var(--bg-surface)] object-cover shadow-lg"
                            />
                            <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--bg-surface)] bg-emerald-500" />
                        </div>

                        {user.html_url && (
                            <a
                                href={user.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-xs font-medium text-[var(--text-body)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--text-heading)]"
                            >
                                GitHub
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>

                    {/* Name + login */}
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--text-heading)]">
                            {user.name ?? user.login}
                        </h2>
                        <p className="text-sm text-[var(--text-muted)]">@{user.login}</p>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <p className="mt-3 text-sm text-[var(--text-body)] leading-relaxed">{user.bio}</p>
                    )}

                    {/* Stats row */}
                    <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-3 text-center">
                        {[
                            { Icon: BookMarked, label: "Repos", value: user.public_repos },
                            { Icon: Users, label: "Followers", value: user.followers },
                            { Icon: UserCheck, label: "Following", value: user.following },
                        ].map(({ Icon, label, value }, idx) => (
                            <div
                                key={label}
                                className={`flex flex-col items-center justify-center p-1 ${idx === 1 ? "border-x border-[var(--border)]" : ""}`}
                            >
                                <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)]">
                                    <Icon className="h-3 w-3 text-[var(--accent)]" />
                                    {label}
                                </span>
                                <span className="mt-1 text-base font-semibold text-[var(--text-heading)]">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Details */}
                    <div className="mt-5 space-y-2.5 text-xs text-[var(--text-muted)]">
                        <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                            <span>{user.email ?? "No public email"}</span>
                        </div>

                        {user.company && (
                            <div className="flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                                <span>{user.company}</span>
                            </div>
                        )}

                        {user.location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                                <span>{user.location}</span>
                            </div>
                        )}

                        {user.twitter_username && (
                            <div className="flex items-center gap-2">
                                <AtSign className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                                <span>@{user.twitter_username}</span>
                            </div>
                        )}

                        {formattedDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                                <span>Joined GitHub {formattedDate}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
