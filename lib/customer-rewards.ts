import type {Prisma,Rental} from '@/app/generated/prisma/client';
import {chargesPaid} from './loyalty-rules';
export async function awardReturnPoint(tx:Prisma.TransactionClient,rental:Rental){
  if(!rental.userId||!rental.stockReturned||rental.rewardUsed||!chargesPaid(rental))return;
  await tx.$queryRaw`SELECT id FROM "User" WHERE id=${rental.userId} FOR UPDATE`;
  const members=rental.loyaltyGroup?await tx.rental.findMany({where:{userId:rental.userId,loyaltyGroup:rental.loyaltyGroup,status:{not:'ยกเลิก'}}}):[rental];
  if(members.some(r=>!r.stockReturned||r.status!=='คืนแล้ว'||r.rewardUsed||!chargesPaid(r)))return;
  const rewardKey='earn:'+(rental.loyaltyGroup?rental.userId+':'+rental.loyaltyGroup:rental.id);
  await tx.loyaltyEntry.createMany({data:[{userId:rental.userId,rentalId:rental.id,rewardKey,points:1}],skipDuplicates:true});
}
export async function refundUnusedReward(tx:Prisma.TransactionClient,rental:Rental){
  if(!rental.rewardUsed||rental.stockApplied&&rental.status!=='จองแล้ว')return;
  await tx.$queryRaw`SELECT id FROM "User" WHERE id=${rental.userId} FOR UPDATE`;
  await tx.loyaltyEntry.createMany({data:[{userId:rental.userId,rentalId:'refund:'+rental.id,rewardKey:'refund:'+rental.id,points:10}],skipDuplicates:true});
}
