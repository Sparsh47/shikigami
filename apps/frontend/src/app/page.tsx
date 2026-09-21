import Link from "next/link";
import { ShikigamiLogo } from "@/components/ShikigamiLogo";
import { GithubIcon } from "@/components/GithubIcon";
import {
    ArrowRight,
    GitBranch,
    BarChart3,
    Zap,
    Bot,
} from "lucide-react";

const FEATURES = [
    {
        Icon: Bot,
        title: "Deploy Any AI Agent",
        description:
            "Push your LangChain, CrewAI, or custom agent code and get a live endpoint in seconds. No infra config needed.",
    },
    {
        Icon: Zap,
        title: "Instant Scaling",
        description:
            "Agents auto-scale to zero between requests and spin up instantly on demand — you only pay for what runs.",
    },
    {
        Icon: GitBranch,
        title: "GitHub-Native Deploys",
        description:
            "Connect a repo and every push to main ships a new agent version. Branches get preview URLs automatically.",
    },
    {
        Icon: BarChart3,
        title: "Built-in Observability",
        description:
            "Live logs, trace viewer, token usage, and latency metrics — everything an agent runtime needs out of the box.",
    },
];

const STEPS = [
    { step: "01", label: "Connect GitHub" },
    { step: "02", label: "Pick a repo" },
    { step: "03", label: "Configure agent" },
    { step: "04", label: "Go live" },
];

export default function Home() {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] overflow-x-hidden">

            {/* Navbar */}
            <header className="border-b border-[var(--border)] backdrop-blur-md sticky top-0 z-40 bg-[var(--bg-base)]/90">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c96b3e]/10 ring-1 ring-[var(--border)]">
                            <ShikigamiLogo className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-[var(--text-heading)]">
                            Shikigami
                        </span>
                    </div>
                    <Link
                        href="/api/auth/github"
                        className="flex items-center gap-2 rounded-lg bg-[#c96b3e] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#b85e34]"
                    >
                        <GithubIcon className="h-3.5 w-3.5" />
                        Sign in
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-28 pb-24 text-center">
                {/* Ambient glow */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[480px] w-[700px] rounded-full opacity-30"
                    style={{ background: "radial-gradient(ellipse at center, #c96b3e22 0%, transparent 70%)" }}
                />

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#c96b3e]/20 bg-[#c96b3e]/8 px-3 py-1 text-xs font-medium text-[#c96b3e] mb-8">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#c96b3e] animate-pulse" />
                    Early Access — Now Available
                </div>

                <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-[var(--text-heading)] sm:text-5xl lg:text-6xl leading-[1.1]">
                    Deploy AI agents{" "}
                    <span
                        className="bg-clip-text text-transparent"
                        style={{ backgroundImage: "linear-gradient(135deg, #c96b3e, #e8956a)" }}
                    >
                        like you deploy websites
                    </span>
                </h1>

                <p className="mx-auto mt-6 max-w-xl text-base text-[var(--text-muted)] leading-relaxed">
                    Shikigami is the fastest way to ship AI agents to production.
                    Connect your GitHub repo, configure your agent, and get a live
                    API endpoint — in under a minute.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/api/auth/github"
                        className="inline-flex items-center gap-2.5 rounded-xl bg-[#c96b3e] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#b85e34] hover:shadow-[#c96b3e]/20"
                        style={{ boxShadow: "0 8px 24px -4px rgba(201,107,62,0.25)" }}
                    >
                        <GithubIcon className="h-4 w-4" />
                        Continue with GitHub
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                        href="https://github.com/Sparsh47/shikigami"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-body)] flex items-center justify-center gap-2"
                    >
                        View source <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Step strip */}
                <div className="mt-16 flex flex-wrap items-center justify-center gap-2">
                    {STEPS.map((s, idx) => (
                        <div key={s.step} className="flex items-center gap-2">
                            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-1.5">
                                <span className="text-[10px] font-mono text-[#c96b3e]">{s.step}</span>
                                <span className="text-xs text-[var(--text-body)]">{s.label}</span>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-[var(--border)]" />
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Dashboard Preview */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-2xl shadow-black/40">
                    {/* Browser chrome */}
                    <div className="border-b border-[var(--border)] px-4 py-3 flex items-center gap-3 bg-[var(--bg-base)]">
                        <div className="flex gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
                            <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)]" />
                        </div>
                        <div className="flex-1 max-w-xs mx-auto rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-center text-[11px] text-[var(--text-muted)]">
                            app.shikigami.dev/dashboard
                        </div>
                    </div>

                    {/* App interior */}
                    <div className="flex min-h-[280px]">
                        {/* Sidebar */}
                        <div className="hidden sm:flex w-48 shrink-0 flex-col border-r border-[var(--border)] p-4 gap-1">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="h-5 w-5 rounded bg-[#c96b3e]/10 flex items-center justify-center">
                                    <Bot className="h-3 w-3 text-[#c96b3e]" />
                                </div>
                                <span className="text-[11px] font-semibold text-[var(--text-heading)]">Shikigami</span>
                            </div>
                            {["Deployments", "Logs", "Settings"].map((item, i) => (
                                <div
                                    key={item}
                                    className={`rounded-lg px-3 py-1.5 text-[11px] ${i === 0
                                        ? "bg-[#c96b3e]/10 text-[#c96b3e] font-medium"
                                        : "text-[var(--text-muted)]"
                                        }`}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>

                        {/* Main */}
                        <div className="flex-1 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-semibold text-[var(--text-heading)]">Deployments</p>
                                <div className="rounded-lg bg-[#c96b3e] px-3 py-1 text-[10px] font-medium text-white">
                                    Add New Agent
                                </div>
                            </div>

                            <div className="space-y-2">
                                {[
                                    { name: "rag-knowledge-agent", status: "Ready", lang: "Python", time: "2m ago" },
                                    { name: "support-triage-bot", status: "Building", lang: "Python", time: "just now" },
                                ].map((agent) => (
                                    <div
                                        key={agent.name}
                                        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-lg bg-[var(--border)] flex items-center justify-center">
                                                <Bot className="h-3 w-3 text-[#c96b3e]" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-medium text-[var(--text-heading)]">{agent.name}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">{agent.lang} · {agent.time}</p>
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${agent.status === "Ready"
                                                ? "bg-emerald-500/10 text-emerald-400"
                                                : "bg-amber-500/10 text-amber-400"
                                                }`}
                                        >
                                            <span className={`h-1 w-1 rounded-full ${agent.status === "Ready" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                                            {agent.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="border-t border-[var(--border)] mx-auto max-w-6xl px-4 sm:px-6 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-semibold text-[var(--text-heading)]">
                        Everything your agent runtime needs
                    </h2>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Built for the modern AI-native developer workflow.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {FEATURES.map(({ Icon, title, description }) => (
                        <div
                            key={title}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 hover:border-[#c96b3e]/30 transition-colors"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-base)] border border-[var(--border)] text-[#c96b3e] mb-4">
                                <Icon className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-[var(--text-heading)]">{title}</h3>
                            <p className="mt-2 text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-[var(--border)]">
                <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 text-center">
                    <h2 className="text-2xl font-semibold text-[var(--text-heading)]">
                        Ship your first agent today
                    </h2>
                    <p className="mt-3 text-sm text-[var(--text-muted)]">
                        No DevOps expertise required. Connect your repo and deploy in under 60 seconds.
                    </p>
                    <Link
                        href="/api/auth/github"
                        className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-[#c96b3e] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#b85e34]"
                        style={{ boxShadow: "0 8px 24px -4px rgba(201,107,62,0.25)" }}
                    >
                        <GithubIcon className="h-4 w-4" />
                        Get started with GitHub
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[var(--border)] py-6 text-center">
                <p className="text-[11px] text-[var(--text-muted)]">
                    © {new Date().getFullYear()} Shikigami · Deploy AI agents like you deploy websites
                </p>
            </footer>
        </div>
    );
}
