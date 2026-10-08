import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/session';
import MemberHome from './member-home';
export const dynamic='force-dynamic';
export default async function MemberPage(){
  const user=await currentUser();if(!user)redirect('/login?next=%2Fmember');
  return <MemberHome/>;
}
