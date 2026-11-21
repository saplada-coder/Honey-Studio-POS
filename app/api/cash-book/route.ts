import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(await prisma.cashEntry.findMany({ orderBy: { createdAt: 'desc' } }), { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { date, desc, type, amt } = body;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || typeof desc !== 'string' || !desc.trim() || !['in', 'out'].includes(type) || typeof amt !== 'number' || !Number.isFinite(amt) || amt < 0.01) {
    return NextResponse.json({ error: 'กรุณากรอกวันที่ รายละเอียด และจำนวนเงินมากกว่า 0' }, { status: 400 });
  }
  return NextResponse.json(await prisma.cashEntry.create({ data: { date, desc: desc.trim(), type, amt: Math.round(amt * 100) / 100 } }), { status: 201 });
}
