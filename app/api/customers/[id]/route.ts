import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {ensureMember} from '@/lib/member-link';
import {memberName,memberPhone} from '@/lib/member-identity';
import {addCustomerRental} from '@/lib/customer-rental';

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const {rental,...body} = await req.json();
  try{
    const updated=await prisma.$transaction(async tx=>{
      const current=await tx.customer.findUniqueOrThrow({where:{id}});
      const identity={name:memberName(body.name??current.name),phone:body.phone??current.phone};
      if(identity.phone&&!memberPhone(identity.phone))throw new Error('กรุณากรอกเบอร์โทรลูกค้าให้ถูกต้อง');
      const userId=await ensureMember(tx,identity);
      // Only claim earlier phone-less bookings when the original customer is unambiguous.
      if(userId&&await tx.customer.count({where:{name:current.name}})===1){
        await tx.rental.updateMany({where:{userId:'',online:false,cust:current.name,phone:current.phone},data:{userId,cust:identity.name,phone:memberPhone(identity.phone)}});
      }
      const customer=await tx.customer.update({where:{id},data:{...body,name:identity.name,phone:memberPhone(identity.phone)}});
      await addCustomerRental(tx,customer,rental);
      return customer;
    },{maxWait:15000,timeout:15000});
    return NextResponse.json(updated);
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'แก้ไขลูกค้าไม่สำเร็จ'},{status:409});}
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
