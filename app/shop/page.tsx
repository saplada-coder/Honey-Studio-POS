import {currentUser} from '@/lib/session';
import {shopInfo,shopProducts,staffRoles} from '@/lib/shop';
import {prisma} from '@/lib/prisma';
import CustomerShop from './customer-shop';
export const dynamic='force-dynamic';
export default async function ShopPage({searchParams}:{searchParams:Promise<{view?:string;product?:string;booking?:string}>}){
  const [user,info,products,reviews,query]=await Promise.all([currentUser(),shopInfo(),shopProducts(),prisma.customerReview.findMany({where:{approved:true,consent:true},select:{id:true,name:true,text:true,image:true},orderBy:{createdAt:'desc'},take:30}),searchParams]);
  const popular=await prisma.rental.groupBy({by:['code'],where:{code:{not:''},status:{not:'ยกเลิก'}},_count:{code:true},orderBy:{_count:{code:'desc'}},take:12});
  return <CustomerShop info={info} products={products} reviews={reviews} popularIds={popular.map(p=>p.code)} user={user?{name:user.name,staff:staffRoles.includes(user.role)}:null} initialView={query.view||(user?'bookings':'login')} initialProduct={query.product||''} initialBooking={query.booking||''}/>;
}
