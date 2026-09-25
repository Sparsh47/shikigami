export interface GitHubUser {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string;
    html_url?: string;
    company?: string | null;
    blog?: string | null;
    location?: string | null;
    email: string | null;
    bio: string | null;
    twitter_username?: string | null;
    public_repos: number;
    public_gists?: number;
    followers: number;
    following: number;
    created_at?: string;
}

export interface DockerUser {
    username: string;
    full_name: string | null;
    company: string | null;
    location: string | null;
    gravatar_url: string | null;
    date_joined: string | null;
    type: string;
}
