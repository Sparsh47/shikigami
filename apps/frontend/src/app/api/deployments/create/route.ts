import { NextRequest, NextResponse } from "next/server";
import { proxyToFastify } from "@/lib/api-proxy";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Strip userId from the body — Fastify now derives it from the verified session header.
        // Clients should NOT send userId; if they do, it's ignored at the schema level.
        const { userId: _ignored, ...safeBody } = body;

        const response = await proxyToFastify("/api/deployments/create", {
            method: "POST",
            body: JSON.stringify(safeBody),
        });

        if (response.status === 401) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(err, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
