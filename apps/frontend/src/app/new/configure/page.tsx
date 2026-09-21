"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GitHubUser } from "@/types/user";
import {
    ArrowLeft,
    ArrowRight,
    Lock,
    Globe,
    GitBranch,
    FolderGit2,
    Terminal,
    Cpu,
    Database,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    Check,
    Loader2,
    Sliders,
    Layers,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Shield,
    ExternalLink,
} from "lucide-react";

interface EnvVar {
    id: string;
    key: string;
    value: string;
    isSecret: boolean;
}

const FRAMEWORK_OPTIONS = [
    {
        id: "langgraph",
        name: "LangGraph / LangChain",
        lang: "Python",
        defaultBuild: "pip install -r requirements.txt",
        defaultRun: "python -m src.agent",
    },
    {
        id: "crewai",
        name: "CrewAI Multi-Agent",
        lang: "Python",
        defaultBuild: "pip install -r requirements.txt",
        defaultRun: "python main.py",
    },
    {
        id: "fastapi",
        name: "FastAPI Agent Service",
        lang: "Python",
        defaultBuild: "pip install -r requirements.txt",
        defaultRun: "uvicorn app.main:app --host 0.0.0.0 --port 8080",
    },
    {
        id: "typescript",
        name: "TypeScript / Vercel AI SDK",
        lang: "TypeScript",
        defaultBuild: "npm install && npm run build",
        defaultRun: "npm start",
    },
    {
        id: "autogen",
        name: "AutoGen (Microsoft)",
        lang: "Python",
        defaultBuild: "pip install -r requirements.txt",
        defaultRun: "python -u agent.py",
    },
    {
        id: "dockerfile",
        name: "Custom Dockerfile (Kaniko)",
        lang: "Dockerfile",
        defaultBuild: "kaniko --dockerfile=Dockerfile",
        defaultRun: "container entrypoint",
    },
];

const PRESET_ENV_VARS = [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "TAVILY_API_KEY",
    "MODEL_NAME",
];

function ConfigureAgentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const repoParam = searchParams.get("repo") || "";
    const nameParam = searchParams.get("name") || "";
    const branchParam = searchParams.get("branch") || "main";
    const langParam = searchParams.get("lang") || "";
    const isPrivate = searchParams.get("private") === "1";
    const templateParam = searchParams.get("template") || "";
    const htmlUrlParam = searchParams.get("url") || "";

    const [user, setUser] = useState<GitHubUser | null>(null);

    // Initial framework detection
    const initialFramework = React.useMemo(() => {
        if (langParam.toLowerCase().includes("typescript") || langParam.toLowerCase().includes("javascript")) {
            return FRAMEWORK_OPTIONS[3];
        }
        return FRAMEWORK_OPTIONS[0];
    }, [langParam]);

    const [agentName, setAgentName] = useState(nameParam || "my-ai-agent");
    const [selectedFramework, setSelectedFramework] = useState(initialFramework);
    const [branch, setBranch] = useState(branchParam);
    const [rootDir, setRootDir] = useState("./");
    const [port, setPort] = useState("8080");

    // Build settings
    const [showBuildSettings, setShowBuildSettings] = useState(false);
    const [overrideBuild, setOverrideBuild] = useState(false);
    const [customBuildCmd, setCustomBuildCmd] = useState(initialFramework.defaultBuild);
    const [overrideRun, setOverrideRun] = useState(false);
    const [customRunCmd, setCustomRunCmd] = useState(initialFramework.defaultRun);

    // Environment Variables
    const [envVars, setEnvVars] = useState<EnvVar[]>([
        { id: "1", key: "ENVIRONMENT", value: "production", isSecret: false },
    ]);
    const [visibleSecretIds, setVisibleSecretIds] = useState<Record<string, boolean>>({});

    // Compute / Resources
    const [memory, setMemory] = useState<"512MB" | "1GB" | "2GB" | "4GB">("1GB");
    const [cpu, setCpu] = useState<"0.5 vCPU" | "1.0 vCPU" | "2.0 vCPU">("1.0 vCPU");
    const [scalingMode, setScalingMode] = useState<"serverless" | "dedicated">("serverless");

    // Deploy State
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployStep, setDeployStep] = useState<string>("");
    const [deployError, setDeployError] = useState<string | null>(null);

    useEffect(() => {
        async function loadUser() {
            try {
                const res = await fetch("/api/auth/github/me");
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch (err) {
                console.error("Failed to load user:", err);
            }
        }
        loadUser();
    }, []);

    const handleFrameworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fw = FRAMEWORK_OPTIONS.find((f) => f.id === e.target.value) || FRAMEWORK_OPTIONS[0];
        setSelectedFramework(fw);
        if (!overrideBuild) setCustomBuildCmd(fw.defaultBuild);
        if (!overrideRun) setCustomRunCmd(fw.defaultRun);
    };

    const addEnvVar = (presetKey?: string) => {
        const newVar: EnvVar = {
            id: Date.now().toString(),
            key: presetKey || "",
            value: "",
            isSecret: presetKey ? presetKey.toLowerCase().includes("key") : false,
        };
        setEnvVars((prev) => [...prev, newVar]);
    };

    const removeEnvVar = (id: string) => {
        setEnvVars((prev) => prev.filter((v) => v.id !== id));
    };

    const updateEnvVar = (id: string, field: "key" | "value", val: string) => {
        setEnvVars((prev) =>
            prev.map((v) => {
                if (v.id !== id) return v;
                const isSecret = field === "key" ? val.toLowerCase().includes("key") || val.toLowerCase().includes("secret") : v.isSecret;
                return { ...v, [field]: val, isSecret };
            })
        );
    };

    const toggleSecretVisibility = (id: string) => {
        setVisibleSecretIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDeploy = async () => {
        if (!agentName.trim()) return;

        setIsDeploying(true);
        setDeployError(null);
        setDeployStep("Connecting to build cluster…");

        // Construct clone URL from htmlUrlParam or repoParam
        let cloneUrl = htmlUrlParam;
        if (!cloneUrl) {
            cloneUrl = `https://github.com/${repoParam}.git`;
        } else if (!cloneUrl.endsWith(".git")) {
            cloneUrl = `${cloneUrl}.git`;
        }

        const buildCmd = overrideBuild ? customBuildCmd : selectedFramework.defaultBuild;
        const rawRunCmd = overrideRun ? customRunCmd : selectedFramework.defaultRun;
        // "container entrypoint" is a placeholder — don't send it, let the image's CMD take over
        const runCmd = rawRunCmd === "container entrypoint" ? "" : rawRunCmd;
        const cpuValue = parseFloat(cpu.replace(/[^0-9.]/g, "")) || 1.0;

        const payload = {
            userId: user ? String(user.id) : "guest-user",
            agentName: agentName.trim(),
            framework: selectedFramework.name,
            repoFullName: repoParam || agentName.trim(),
            cloneUrl,
            branch: branch || "main",
            isPrivate: Boolean(isPrivate),
            rootDir: rootDir || "./",
            buildCommand: buildCmd,
            runCommand: runCmd,
            port: parseInt(port, 10) || 8080,
            memory: memory,
            cpu: cpuValue,
            scalingMode: scalingMode,
            envVars: envVars
                .filter((v) => v.key.trim() !== "")
                .map((v) => ({
                    key: v.key.trim(),
                    value: v.value,
                    isSecret: v.isSecret,
                })),
        };

        try {
            setDeployStep("Triggering Kaniko container build…");

            const res = await fetch("http://localhost:8080/api/deployments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || "Failed to create deployment");
            }

            const data = await res.json();
            setDeployStep("Build job queued successfully in cluster!");

            setTimeout(() => {
                router.push("/dashboard");
            }, 1200);
        } catch (err: any) {
            console.error("Deployment request failed:", err);
            setIsDeploying(false);
            setDeployError(err.message || "Failed to create deployment. Is the backend running on port 8080?");
        }
    };

    const displayRepoName = repoParam || nameParam || "custom-agent-repo";

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-heading)] flex flex-col">
            <Navbar user={user} />

            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8 space-y-8">
                {/* Back + Header */}
                <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] mb-4">
                        <Link
                            href="/dashboard"
                            className="hover:text-[var(--text-heading)] transition-colors"
                        >
                            Deployments
                        </Link>
                        <span>/</span>
                        <Link
                            href="/new"
                            className="hover:text-[var(--text-heading)] transition-colors"
                        >
                            New Agent
                        </Link>
                        <span>/</span>
                        <span className="text-[#c96b3e]">Configure</span>
                    </div>

                    <Link
                        href="/new"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors mb-3"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to repositories
                    </Link>

                    <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-heading)]">
                        Configure Agent Deployment
                    </h1>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Review repository settings, framework presets, runtime environment, and container scaling.
                    </p>
                </div>

                {/* Repository Identity Card */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-base)] text-[#c96b3e] border border-[var(--border)]">
                            <FolderGit2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-semibold text-[var(--text-heading)] truncate">
                                    {displayRepoName}
                                </span>
                                {isPrivate ? (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                                        <Lock className="h-2.5 w-2.5" />
                                        Private
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                                        <Globe className="h-2.5 w-2.5" />
                                        Public
                                    </span>
                                )}
                                {templateParam && (
                                    <span className="rounded-md bg-[#c96b3e]/15 border border-[#c96b3e]/30 px-2 py-0.5 text-[10px] font-medium text-[#c96b3e]">
                                        Template: {templateParam}
                                    </span>
                                )}
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                <span className="inline-flex items-center gap-1">
                                    <GitBranch className="h-3 w-3 text-[var(--text-muted)]" />
                                    {branch}
                                </span>
                                {htmlUrlParam && (
                                    <a
                                        href={htmlUrlParam}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 hover:text-[var(--text-heading)] transition-colors"
                                    >
                                        GitHub
                                        <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/new"
                        className="self-start sm:self-auto rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:border-[var(--text-muted)]/40 transition-colors shrink-0"
                    >
                        Change repository
                    </Link>
                </div>

                {/* Configuration Sections */}
                <div className="space-y-6">

                    {/* Section 1: General Project & Framework Settings */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                        <div className="border-b border-[var(--border)] px-6 py-4 flex items-center gap-2.5">
                            <Sliders className="h-4 w-4 text-[#c96b3e]" />
                            <h2 className="text-sm font-semibold text-[var(--text-heading)]">Project Settings</h2>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                        Agent Name
                                    </label>
                                    <input
                                        type="text"
                                        value={agentName}
                                        onChange={(e) => setAgentName(e.target.value)}
                                        placeholder="my-agent"
                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:border-[#c96b3e]/50 focus:outline-none transition-colors"
                                    />
                                    <p className="mt-1.5 text-[11px] text-[var(--text-muted)] font-mono">
                                        Domain: https://{agentName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "agent"}.shikigami.app
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                        Framework / Architecture Preset
                                    </label>
                                    <select
                                        value={selectedFramework.id}
                                        onChange={handleFrameworkChange}
                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2 text-sm text-[var(--text-heading)] focus:border-[#c96b3e]/50 focus:outline-none transition-colors cursor-pointer"
                                    >
                                        {FRAMEWORK_OPTIONS.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.name} ({f.lang})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                                        Auto-configures Kaniko container builder and entrypoint runner.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-[var(--border)]/60">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                        Production Branch
                                    </label>
                                    <div className="relative">
                                        <GitBranch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                                        <input
                                            type="text"
                                            value={branch}
                                            onChange={(e) => setBranch(e.target.value)}
                                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] py-2 pl-9 pr-4 text-sm text-[var(--text-heading)] focus:border-[#c96b3e]/50 focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                        Root Directory
                                    </label>
                                    <input
                                        type="text"
                                        value={rootDir}
                                        onChange={(e) => setRootDir(e.target.value)}
                                        placeholder="./"
                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2 text-sm text-[var(--text-heading)] focus:border-[#c96b3e]/50 focus:outline-none transition-colors font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Build & Output Settings (Kaniko) */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setShowBuildSettings(!showBuildSettings)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--bg-base)]/30 transition-colors"
                        >
                            <div className="flex items-center gap-2.5">
                                <Terminal className="h-4 w-4 text-[#c96b3e]" />
                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--text-heading)]">
                                        Build & Output Settings
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        In-cluster Kaniko build commands and execution runner
                                    </p>
                                </div>
                            </div>
                            {showBuildSettings ? (
                                <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                            )}
                        </button>

                        {showBuildSettings && (
                            <div className="p-6 border-t border-[var(--border)] space-y-5">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-medium text-[var(--text-muted)]">
                                            Build Command
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setOverrideBuild(!overrideBuild)}
                                            className="text-[11px] font-medium text-[#c96b3e] hover:underline"
                                        >
                                            {overrideBuild ? "Reset to default" : "Override"}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        disabled={!overrideBuild}
                                        value={customBuildCmd}
                                        onChange={(e) => setCustomBuildCmd(e.target.value)}
                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2 text-xs font-mono text-[var(--text-heading)] disabled:opacity-60 disabled:cursor-not-allowed focus:border-[#c96b3e]/50 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-medium text-[var(--text-muted)]">
                                            Run / Start Command
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setOverrideRun(!overrideRun)}
                                            className="text-[11px] font-medium text-[#c96b3e] hover:underline"
                                        >
                                            {overrideRun ? "Reset to default" : "Override"}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        disabled={!overrideRun}
                                        value={customRunCmd}
                                        onChange={(e) => setCustomRunCmd(e.target.value)}
                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2 text-xs font-mono text-[var(--text-heading)] disabled:opacity-60 disabled:cursor-not-allowed focus:border-[#c96b3e]/50 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                        Listening Port
                                    </label>
                                    <input
                                        type="text"
                                        value={port}
                                        onChange={(e) => setPort(e.target.value)}
                                        className="w-32 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3.5 py-2 text-xs font-mono text-[var(--text-heading)] focus:border-[#c96b3e]/50 focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Environment Variables */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                        <div className="border-b border-[var(--border)] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <Database className="h-4 w-4 text-[#c96b3e]" />
                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--text-heading)]">
                                        Environment Variables
                                    </h2>
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                        API keys, secrets, and model configurations passed securely to your container
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => addEnvVar()}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-xs font-medium text-[var(--text-body)] hover:text-white hover:border-[#c96b3e]/40 transition-colors self-start sm:self-auto cursor-pointer"
                            >
                                <Plus className="h-3 w-3" />
                                Add Variable
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Preset Quick Chips */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-[var(--text-muted)]">Quick Add:</span>
                                {PRESET_ENV_VARS.map((key) => {
                                    const exists = envVars.some((v) => v.key === key);
                                    if (exists) return null;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => addEnvVar(key)}
                                            className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[#c96b3e] hover:border-[#c96b3e]/40 transition-colors cursor-pointer"
                                        >
                                            <Plus className="h-2.5 w-2.5" />
                                            {key}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Variable rows */}
                            {envVars.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-xs text-[var(--text-muted)]">
                                    No environment variables added. Add API keys like OPENAI_API_KEY if required.
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {envVars.map((v) => {
                                        const isVisible = visibleSecretIds[v.id];
                                        return (
                                            <div
                                                key={v.id}
                                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)]/60"
                                            >
                                                <input
                                                    type="text"
                                                    value={v.key}
                                                    onChange={(e) => updateEnvVar(v.id, "key", e.target.value)}
                                                    placeholder="KEY (e.g. OPENAI_API_KEY)"
                                                    className="w-full sm:w-1/3 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-xs font-mono text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:border-[#c96b3e]/50 focus:outline-none transition-colors"
                                                />

                                                <div className="relative flex-1">
                                                    <input
                                                        type={v.isSecret && !isVisible ? "password" : "text"}
                                                        value={v.value}
                                                        onChange={(e) => updateEnvVar(v.id, "value", e.target.value)}
                                                        placeholder="Value"
                                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] py-1.5 pl-3 pr-8 text-xs font-mono text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:border-[#c96b3e]/50 focus:outline-none transition-colors"
                                                    />
                                                    {v.isSecret && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSecretVisibility(v.id)}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
                                                        >
                                                            {isVisible ? (
                                                                <EyeOff className="h-3 w-3" />
                                                            ) : (
                                                                <Eye className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeEnvVar(v.id)}
                                                    className="self-end sm:self-center p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 4: Agent Compute & Scaling */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                        <div className="border-b border-[var(--border)] px-6 py-4 flex items-center gap-2.5">
                            <Cpu className="h-4 w-4 text-[#c96b3e]" />
                            <h2 className="text-sm font-semibold text-[var(--text-heading)]">
                                Compute & Scaling Profile
                            </h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                    RAM Allocation
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {(["512MB", "1GB", "2GB", "4GB"] as const).map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMemory(m)}
                                            className={`rounded-lg py-1.5 text-xs font-medium transition-colors cursor-pointer border ${memory === m
                                                    ? "bg-[#c96b3e]/15 text-[#c96b3e] border-[#c96b3e]/40"
                                                    : "bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-heading)]"
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                    CPU Limit
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {(["0.5 vCPU", "1.0 vCPU", "2.0 vCPU"] as const).map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setCpu(c)}
                                            className={`rounded-lg py-1.5 text-xs font-medium transition-colors cursor-pointer border ${cpu === c
                                                    ? "bg-[#c96b3e]/15 text-[#c96b3e] border-[#c96b3e]/40"
                                                    : "bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-heading)]"
                                                }`}
                                        >
                                            {c.replace(" vCPU", "")}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                                    Scaling Policy
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {[
                                        { id: "serverless", label: "Auto Zero" },
                                        { id: "dedicated", label: "Always On" },
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => setScalingMode(mode.id as typeof scalingMode)}
                                            className={`rounded-lg py-1.5 text-xs font-medium transition-colors cursor-pointer border ${scalingMode === mode.id
                                                    ? "bg-[#c96b3e]/15 text-[#c96b3e] border-[#c96b3e]/40"
                                                    : "bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-heading)]"
                                                }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deployment Progress Bar / Status Banner when deploying */}
                {isDeploying && (
                    <div className="rounded-2xl border border-[#c96b3e]/30 bg-[var(--bg-surface)] p-6 shadow-xl">
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-[#c96b3e]" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-[var(--text-heading)]">
                                    Deploying Agent to Kubernetes…
                                </h4>
                                <p className="text-xs text-[#c96b3e] font-mono mt-0.5">
                                    {deployStep}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-base)]">
                            <div className="h-full bg-[#c96b3e] animate-pulse w-3/4 rounded-full" />
                        </div>
                    </div>
                )}

                {/* Error banner if deployment fails */}
                {deployError && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
                        {deployError}
                    </div>
                )}

                {/* Bottom Bar: Cancel + Deploy Agent */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <Link
                        href="/new"
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text-heading)] transition-colors"
                    >
                        Cancel
                    </Link>

                    <button
                        type="button"
                        onClick={handleDeploy}
                        disabled={isDeploying || !agentName.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#c96b3e] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b85e34] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#c96b3e]/20 cursor-pointer"
                    >
                        {isDeploying ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deploying…
                            </>
                        ) : (
                            <>
                                Deploy Agent
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default function ConfigureAgentPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#c96b3e]" />
                    </div>
                </div>
            }
        >
            <ConfigureAgentContent />
        </Suspense>
    );
}
