import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const FASTIFY_BASE = "http://localhost:8080";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET!;

async function getVerifiedUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("github_access_token")?.value;
    if (!token) return null;

    const res = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "Shikigami-App",
        },
        next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const user = await res.json();
    const id = user?.id;
    return id != null ? String(id) : null;
}

export async function proxyToFastify(
    path: string,
    init?: RequestInit,
): Promise<Response> {
    const userId = await getVerifiedUserId();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return fetch(`${FASTIFY_BASE}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
            "x-internal-secret": INTERNAL_SECRET,
            "x-user-id": userId,
        },
    });
}
