import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const response = await fetch(`http://localhost:8080/api/deployments/${id}`);

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch deployment" }, { status: 500 });
        }

        const data = await response.json();

        return NextResponse.json(data);

    } catch (error) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}