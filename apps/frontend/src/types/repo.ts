export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    fork: boolean;
    url: string;
    created_at: string;
    updated_at: string;
    pushed_at?: string;
    clone_url: string;
    default_branch: string;
    language: string | null;
    stargazers_count: number;
    owner: {
        login: string;
        avatar_url: string;
    };
}

export interface AgentDeployment {
    id: string;
    name: string;
    repo: string;
    branch: string;
    commitSha: string;
    commitMessage: string;
    status: "ready" | "building" | "failed" | "queued";
    url: string;
    framework: string;
    createdAt: string;
    updatedAt: string;
}
