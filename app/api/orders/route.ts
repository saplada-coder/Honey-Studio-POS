import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = await prisma.order.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.order.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
