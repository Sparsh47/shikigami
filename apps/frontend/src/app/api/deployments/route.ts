import { NextRequest, NextResponse } from "next/server";
import { proxyToFastify } from "@/lib/api-proxy";

export async function GET(request: NextRequest) {
    try {
        const repo = request.nextUrl.searchParams.get("repo");
        const agentName = request.nextUrl.searchParams.get("agentName");
        const params = new URLSearchParams();
        if (repo) params.set("repo", repo);
        if (agentName) params.set("agentName", agentName);
        const query = params.toString() ? `?${params.toString()}` : "";
        const response = await proxyToFastify(`/api/deployments${query}`);

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
