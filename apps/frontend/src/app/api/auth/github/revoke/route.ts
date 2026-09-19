import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const accessToken = request.cookies.get("github_access_token")?.value;

    if (accessToken && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        try {
            const basicAuth = Buffer.from(
                `${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`
            ).toString("base64");

            // GitHub OAuth application API to delete grant/token
            const revokeResponse = await fetch(
                `https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/grant`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Basic ${basicAuth}`,
                        Accept: "application/vnd.github+json",
                        "User-Agent": "Shikigami-App",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ access_token: accessToken }),
                }
            );

            // If grant deletion is not supported for this token type, fallback to deleting token
            if (!revokeResponse.ok) {
                await fetch(
                    `https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Basic ${basicAuth}`,
                            Accept: "application/vnd.github+json",
                            "User-Agent": "Shikigami-App",
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ access_token: accessToken }),
                    }
                );
            }
        } catch (error) {
            console.error("Error revoking GitHub token:", error);
        }
    }

    // Always clear the local session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("github_access_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    return response;
}
