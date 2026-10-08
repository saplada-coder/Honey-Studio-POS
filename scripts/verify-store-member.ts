import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {config} from 'dotenv';
import {Client} from 'pg';
import {createSession} from '../lib/auth';
import {thaiToday} from '../lib/booking-availability';
config({path:'.env.local',quiet:true});
async function main(){
  const base='http://127.0.0.1:3019',suffix=randomUUID(),code='TEST-MEMBER-'+suffix,email='member-'+suffix+'@example.invalid';
  const staff=await createSession({id:'test-owner',name:'ทดสอบ',role:'เจ้าของ',email:'owner@example.invalid'});
  const other=await createSession({id:'other-'+suffix,name:'สมาชิกหน้าร้านทดสอบ',role:'ลูกค้า',email:'other@example.invalid'});
  const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();let memberId='';
  async function req(path:string,cookie='',method='GET',body?:object){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:'hs_session='+cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};}
  try{
    const join=await fetch(base+'/join',{redirect:'manual'});assert.equal(join.status,307);assert.ok(join.headers.get('location')?.includes('/customer-login'));
    const register=await req('/api/auth/register','','POST',{name:'สมาชิกหน้าร้านทดสอบ',email,password:'test-'+suffix});assert.equal(register.status,200);memberId=register.data.user.id;
    const cookie=register.cookie!.match(/hs_session=([^;]+)/)![1];
    const joined=await fetch(base+'/join',{headers:{Cookie:'hs_session='+cookie},redirect:'manual'});assert.ok(joined.headers.get('location')?.endsWith('/member'));
    const memberPage=await fetch(base+'/member',{headers:{Cookie:'hs_session='+cookie}});assert.equal(memberPage.status,200);assert.ok((await memberPage.text()).includes('ข้อมูลการจอง+สะสมแต้ม'));
    assert.equal((await req('/api/shop/customer-account',cookie)).data.memberId,memberId);
    assert.equal((await req('/api/products',staff,'POST',{id:code,name:'ชุดทดสอบสมาชิกหน้าร้าน',cat:'ชุดราตรี',type:'เช่า',rent:300,stockRent:1,stockSell:0})).status,201);
    const body={id:'TEST-WALKIN-'+suffix,code,item:'ชุดทดสอบสมาชิกหน้าร้าน',cust:'สมาชิกหน้าร้านทดสอบ',start:thaiToday(),end:new Date(Date.parse(thaiToday())+86400000).toISOString().slice(0,10),fee:300,deposit:300,status:'รับชุดแล้ว',paymentStatus:'ชำระแล้ว'};
    assert.equal((await req('/api/rentals',staff,'POST',{...body,userId:'unknown-member'})).status,409);
    assert.equal((await req('/api/rentals',staff,'POST',{...body,userId:memberId,start:'16 มิ.ย.'})).status,409);
    const rental=await req('/api/rentals',staff,'POST',{...body,userId:memberId});assert.equal(rental.status,201);assert.equal(rental.data.online,false);
    const account=await req('/api/shop/customer-account',cookie);assert.equal(account.data.rentals.length,1);assert.equal(account.data.balance,0);assert.ok(account.data.notifications.length>0);
    assert.equal((await req('/api/shop/customer-account',other)).data.rentals.length,0);assert.equal((await req('/api/rentals',other)).data.some((r:{id:string})=>r.id===body.id),false);
    assert.equal((await req('/api/rentals/'+body.id,staff,'PATCH',{status:'คืนแล้ว'})).status,200);assert.equal((await req('/api/rentals/'+body.id,staff,'PATCH',{status:'คืนแล้ว'})).status,200);assert.equal((await req('/api/shop/customer-account',cookie)).data.balance,1);
    assert.equal((await req('/api/rentals/'+body.id,staff,'PATCH',{userId:''})).status,409);
    const action='/api/products/'+code+'/rental-actions';
    const qr=await req(action,staff,'POST',{action:'rent',paymentStatus:'ชำระแล้ว',userId:memberId,cust:'สมาชิกหน้าร้านทดสอบ',start:thaiToday(),days:1});assert.equal(qr.status,201);
    assert.equal((await req(action,staff,'POST',{action:'return',rentalId:qr.data.rental.id})).status,200);assert.equal((await req('/api/shop/customer-account',cookie)).data.balance,2);
    console.log('PASS: store QR redirects, signup session, member home, valid member link, walk-in rental privacy, reminders, POS/QR return points and duplicate prevention');
  }finally{
    await db.query('BEGIN');await db.query('DELETE FROM "LoyaltyEntry" WHERE "userId"=$1',[memberId]);await db.query('DELETE FROM "NotificationRead" WHERE "userId"=$1',[memberId]);await db.query('DELETE FROM "Rental" WHERE code=$1',[code]);await db.query('DELETE FROM "Product" WHERE id=$1',[code]);await db.query('DELETE FROM "User" WHERE email=$1',[email]);await db.query('COMMIT');await db.end();console.log('Temporary member test data removed');
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
