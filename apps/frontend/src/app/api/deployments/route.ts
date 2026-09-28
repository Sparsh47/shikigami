import { NextRequest, NextResponse } from "next/server";
import { proxyToFastify } from "@/lib/api-proxy";

// GET /api/deployments  →  lists all deployments for the authenticated user
export async function GET() {
    try {
        // No userId query param — Fastify reads it from the x-user-id header
        const response = await proxyToFastify("/api/deployments/");

        if (response.status === 401) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch deployments" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
