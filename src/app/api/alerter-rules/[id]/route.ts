import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.API_BASE_URL!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const res = await fetch(`${API}/api/alerter-rules/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const res = await fetch(`${API}/api/alerter-rules/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const res = await fetch(`${API}/api/alerter-rules/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
