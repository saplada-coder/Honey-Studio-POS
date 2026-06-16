import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  const clean = String(name || "").trim();
  if (!clean) return NextResponse.json({ error: "กรุณากรอกชื่อหมวดหมู่" }, { status: 400 });
  const existing = await prisma.category.findUnique({ where: { name: clean } });
  if (existing) return NextResponse.json({ error: "มีหมวดหมู่นี้อยู่แล้ว" }, { status: 409 });
  const cat = await prisma.category.create({ data: { name: clean } });
  return NextResponse.json(cat, { status: 201 });
}
