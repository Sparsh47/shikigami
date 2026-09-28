import { NextRequest, NextResponse } from "next/server";
import { proxyToFastify } from "@/lib/api-proxy";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const response = await proxyToFastify(`/api/deployments/${id}/settings`, {
            method: "PATCH",
            body: JSON.stringify(body),
        });

        if (response.status === 401) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            return NextResponse.json(err, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
