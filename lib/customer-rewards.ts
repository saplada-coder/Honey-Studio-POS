import type {Prisma} from '@/app/generated/prisma/client';

// Unique rentalId keeps rewards immutable and prevents repeated returns earning twice.
export async function awardReturnPoint(tx:Prisma.TransactionClient,rental:{id:string;userId:string;online:boolean;paymentStatus:string;stockReturned:boolean}){
  if(!rental.userId||!rental.stockReturned||(rental.online&&rental.paymentStatus!=='ชำระแล้ว'))return;
  await tx.loyaltyEntry.createMany({data:[{userId:rental.userId,rentalId:rental.id,points:1}],skipDuplicates:true});
}
