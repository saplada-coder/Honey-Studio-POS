import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const shipments = await prisma.shipment.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(shipments);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.shipment.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
