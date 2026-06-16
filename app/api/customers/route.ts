import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const customers = await prisma.customer.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.customer.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
