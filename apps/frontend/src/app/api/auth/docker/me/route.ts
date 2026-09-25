import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const pat = request.cookies.get("docker_pat")?.value;
    const username = request.cookies.get("docker_username")?.value;

    if (!pat || !username) {
        return NextResponse.json({ error: "Not connected" }, { status: 401 });
    }

    try {
        // Fetch the full Docker Hub user profile
        const res = await fetch(`https://hub.docker.com/v2/users/${username}`, {
            headers: {
                Authorization: `Bearer ${pat}`,
                Accept: "application/json",
            },
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch Docker Hub user" },
                { status: res.status }
            );
        }

        const user = await res.json();

        return NextResponse.json({
            user: {
                username: user.username,
                full_name: user.full_name ?? null,
                company: user.company ?? null,
                location: user.location ?? null,
                gravatar_url: user.gravatar_url ?? null,
                date_joined: user.date_joined ?? null,
                type: user.type ?? "User",
            },
        });
    } catch (err) {
        console.error("Docker me error:", err);
        return NextResponse.json(
            { error: "Unexpected error fetching Docker Hub user" },
            { status: 500 }
        );
    }
}
