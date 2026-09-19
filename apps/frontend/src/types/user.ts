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
