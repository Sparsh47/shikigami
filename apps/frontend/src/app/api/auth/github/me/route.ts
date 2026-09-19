import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get("github_access_token")?.value;

    if (!accessToken) {
        return NextResponse.json({
            error: "Unauthorized"
        }, { status: 401 })
    }

    const userResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "User-Agent": "Shikigami-App",
        },
    });

    if (!userResponse.ok) {
        return NextResponse.json({
            error: "Failed to fetch user"
        }, { status: 500 });
    }

    const user = await userResponse.json();

    return NextResponse.json({ user });
}