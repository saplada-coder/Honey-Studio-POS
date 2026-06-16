import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rentals = await prisma.rental.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(rentals);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.rental.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
