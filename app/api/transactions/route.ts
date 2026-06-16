import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const txns = await prisma.transaction.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(txns);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.transaction.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
