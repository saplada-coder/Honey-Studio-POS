import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/session';
import MemberHome from './member-home';
import {shopInfo} from '@/lib/shop';
import {prisma} from '@/lib/prisma';
export const dynamic='force-dynamic';
export default async function MemberPage(){
  const user=await currentUser();if(!user)redirect('/customer-login');
  const [info,reviews]=await Promise.all([shopInfo(),prisma.customerReview.findMany({where:{approved:true,consent:true},select:{id:true,name:true,text:true,image:true},orderBy:{createdAt:'desc'},take:30})]);
  return <MemberHome info={info} reviews={reviews}/>;
}
