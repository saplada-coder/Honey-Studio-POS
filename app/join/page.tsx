import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/session';
export const dynamic='force-dynamic';
export default async function Join(){
  const user=await currentUser();
  redirect(user?(user.role==='ลูกค้า'?'/member':'/staff'):'/login?next=%2Fmember');
}
