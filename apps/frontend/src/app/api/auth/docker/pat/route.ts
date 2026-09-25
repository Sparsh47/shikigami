import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { token, username } = await req.json();

        if (!token || !username) {
            return NextResponse.json(
                { error: "Username and PAT token are required." },
                { status: 400 }
            );
        }

        // Validate the PAT against Docker Hub API
        const credentials = Buffer.from(`${username}:${token}`).toString("base64");
        const res = await fetch("https://hub.docker.com/v2/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password: token }),
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Invalid Docker Hub credentials. Please check your username and PAT token." },
                { status: 401 }
            );
        }

        const data = await res.json();

        const response = NextResponse.json({ success: true, username });

        // Store the PAT in an httpOnly cookie
        response.cookies.set("docker_pat", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            sameSite: "lax",
        });

        response.cookies.set("docker_username", username, {
            httpOnly: false, // readable client-side for display
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            sameSite: "lax",
        });

        return response;
    } catch (err) {
        console.error("Docker PAT validation error:", err);
        return NextResponse.json(
            { error: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete("docker_pat");
    response.cookies.delete("docker_username");
    return response;
}
