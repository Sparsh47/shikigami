import Link from "next/link";
import { ShikigamiLogo } from "@/components/ShikigamiLogo";
import { GithubIcon } from "@/components/GithubIcon";

const FEATURES = [
    {
        icon: "🤖",
        title: "Deploy Any AI Agent",
        description:
            "Push your LangChain, CrewAI, or custom agent code and get a live endpoint in seconds. No infra config needed.",
    },
    {
        icon: "⚡",
        title: "Instant Scaling",
        description:
            "Agents auto-scale to zero between requests and spin up instantly on demand — you only pay for what runs.",
    },
    {
        icon: "🔗",
        title: "GitHub-Native Deploys",
        description:
            "Connect a repo and every push to main ships a new agent version. Branches get preview URLs automatically.",
    },
    {
        icon: "🔍",
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

const AGENT_CARDS = [
    { name: "customer-support-v2", status: "Live", lang: "Python", updated: "2m ago", color: "emerald" },
    { name: "data-analyst-agent", status: "Deploying", lang: "TypeScript", updated: "just now", color: "yellow" },
    { name: "rag-pipeline-v1", status: "Live", lang: "Python", updated: "1h ago", color: "emerald" },
];

export default function Home() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">

            {/* Navbar */}
            <header className="border-b border-zinc-800/60 backdrop-blur-sm sticky top-0 z-40 bg-zinc-950/80">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 ring-1 ring-zinc-800">
                            <ShikigamiLogo className="h-5 w-5" />
                        </div>
                        <span className="text-[15px] font-semibold tracking-tight text-zinc-100">
                            Shikigami
                        </span>
                    </div>
                    <Link
                        href="/api/auth/github"
                        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3.5 py-1.5 text-[13px] font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white"
                    >
                        <GithubIcon className="h-3.5 w-3.5" />
                        Sign in
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-24 pb-20 text-center">
                {/* Glow */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[520px] w-[800px] rounded-full bg-indigo-700/10 blur-3xl"
                />

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 mb-8">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    The AI Agent Cloud — Now in Early Access
                </div>

                <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-[3.75rem] leading-[1.1]">
                    Deploy AI agents{" "}
                    <br className="hidden sm:block" />
                    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                        like you deploy websites
                    </span>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-zinc-400 leading-relaxed">
                    Shikigami is the fastest way to ship AI agents to production.
                    Connect your GitHub repo, configure your agent, and get a live
                    API endpoint — in under a minute.
                </p>

                {/* CTA */}
                <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/api/auth/github"
                        className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-lg shadow-white/5 transition-all hover:bg-zinc-100"
                    >
                        <GithubIcon className="h-4 w-4" />
                        Continue with GitHub
                        <span className="text-zinc-400 transition-transform group-hover:translate-x-0.5">→</span>
                    </Link>
                    <span className="text-xs text-zinc-600">
                        Free · No credit card · Deploy in 60 seconds
                    </span>
                </div>

                {/* Steps row */}
                <div className="mt-14 flex items-center justify-center gap-2 flex-wrap">
                    {STEPS.map((s, i) => (
                        <div key={s.step} className="flex items-center gap-2">
                            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                                <span className="text-[10px] font-mono text-indigo-400">{s.step}</span>
                                <span className="text-xs text-zinc-300">{s.label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <span className="text-zinc-700">→</span>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Dashboard Preview */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-24">
                <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50">
                    {/* Window chrome */}
                    <div className="flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-800/40 px-4 py-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                        <div className="ml-auto flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                            <span className="text-[11px] text-zinc-500">shikigami.app/dashboard</span>
                        </div>
                        <div className="ml-2" />
                    </div>

                    {/* Fake Dashboard */}
                    <div className="flex min-h-[340px]">
                        {/* Sidebar */}
                        <div className="hidden sm:flex w-44 flex-col border-r border-zinc-800 bg-zinc-950/40 p-3 gap-0.5">
                            {["Agents", "Deployments", "Logs", "Settings"].map((item, i) => (
                                <div
                                    key={item}
                                    className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium ${
                                        i === 0
                                            ? "bg-zinc-800 text-zinc-100"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>

                        {/* Main pane */}
                        <div className="flex-1 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[13px] font-semibold text-zinc-200">
                                    My Agents
                                </p>
                                <div className="rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white">
                                    + New Agent
                                </div>
                            </div>

                            <div className="space-y-2">
                                {AGENT_CARDS.map((agent) => (
                                    <div
                                        key={agent.name}
                                        className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 px-4 py-3 hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 ring-1 ring-zinc-700 flex items-center justify-center text-[13px]">
                                                🤖
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-medium text-zinc-200">
                                                    {agent.name}
                                                </p>
                                                <p className="text-[10px] text-zinc-500">
                                                    {agent.lang} · Updated {agent.updated}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                    agent.color === "emerald"
                                                        ? "bg-emerald-500/10 text-emerald-400"
                                                        : "bg-yellow-500/10 text-yellow-400"
                                                }`}
                                            >
                                                <span
                                                    className={`h-1 w-1 rounded-full ${
                                                        agent.color === "emerald"
                                                            ? "bg-emerald-400"
                                                            : "bg-yellow-400 animate-pulse"
                                                    }`}
                                                />
                                                {agent.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
                        Everything your agent needs to ship
                    </h2>
                    <p className="mt-3 text-sm text-zinc-500 max-w-lg mx-auto">
                        Shikigami handles the infra so you can focus on building the intelligence.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-px rounded-2xl border border-zinc-800 bg-zinc-800 overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
                    {FEATURES.map((f) => (
                        <div
                            key={f.title}
                            className="bg-zinc-950 p-6 transition-colors hover:bg-zinc-900/60"
                        >
                            <div className="mb-3 text-2xl">{f.icon}</div>
                            <h3 className="text-[13px] font-semibold text-zinc-100">
                                {f.title}
                            </h3>
                            <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
                                {f.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="border-t border-zinc-800/60">
                <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 text-center">
                    <h2 className="text-2xl font-bold text-zinc-50 sm:text-3xl">
                        Ship your first agent today
                    </h2>
                    <p className="mt-3 text-sm text-zinc-500">
                        Join developers using Shikigami to deploy AI agents in production — no DevOps expertise required.
                    </p>
                    <Link
                        href="/api/auth/github"
                        className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                    >
                        <GithubIcon className="h-4 w-4" />
                        Get started with GitHub
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-800/60 py-6 text-center">
                <p className="text-[11px] text-zinc-700">
                    © 2026 Shikigami · Deploy AI agents like you deploy websites
                </p>
            </footer>
        </div>
    );
}
