import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get("github_access_token")?.value;

    if (!accessToken) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const reposResponse = await fetch(
            "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/vnd.github+json",
                    "User-Agent": "Shikigami-App",
                },
                next: { revalidate: 30 },
            }
        );

        if (!reposResponse.ok) {
            const errText = await reposResponse.text();
            console.error("GitHub repos API error:", reposResponse.status, errText);
            return NextResponse.json(
                { error: "Failed to fetch repositories from GitHub" },
                { status: reposResponse.status }
            );
        }

        const repos = await reposResponse.json();
        return NextResponse.json({ repos });
    } catch (error) {
        console.error("Error fetching GitHub repos:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
