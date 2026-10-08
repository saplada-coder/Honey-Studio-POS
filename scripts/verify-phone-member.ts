import assert from 'node:assert/strict';
import {randomUUID,createHash,randomInt} from 'node:crypto';
import {config} from 'dotenv';
import {Client} from 'pg';
import {createSession} from '../lib/auth';
import {thaiToday} from '../lib/booking-availability';
config({path:'.env.local',quiet:true});
async function main(){
  const base='http://127.0.0.1:3019',suffix=randomUUID(),name='ทดสอบชื่อเบอร์ '+suffix,code='TEST-PHONE-'+suffix,legacyId='TEST-LEGACY-'+suffix,ip='test-'+suffix;
  const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();const users:string[]=[];let limitKey='';
  const staff=await createSession({id:'test-owner',name:'ทดสอบ',role:'เจ้าของ',email:'owner@example.invalid'});
  async function freePhone(){let value='';do{value='09'+String(randomInt(0,100000000)).padStart(8,'0');}while((await db.query('SELECT id FROM "User" WHERE phone=$1',[value])).rowCount);return value;}
  async function req(path:string,cookie='',method='GET',body?:object){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json','x-vercel-forwarded-for':ip,...(cookie?{Cookie:'hs_session='+cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};}
  const phone=await freePhone(),phone2=await freePhone();
  try{
    const publicLogin=await fetch(base+'/customer-login');assert.equal(publicLogin.status,200);const loginHtml=await publicLogin.text();assert.ok(loginHtml.includes('เบอร์โทรศัพท์'));assert.ok(!loginHtml.includes('type="password"'));
    assert.equal((await req('/api/auth/member','','POST',{name,phone:'invalid'})).status,400);
    const first=await req('/api/auth/member','','POST',{name,phone,role:'เจ้าของ'});assert.equal(first.status,200);assert.equal(first.data.user.role,'ลูกค้า');users.push(first.data.user.id);const cookie=first.cookie!.match(/hs_session=([^;]+)/)![1];
    const again=await req('/api/auth/member','','POST',{name,phone:'+66'+phone.slice(1)});assert.equal(again.status,200);assert.equal(again.data.user.id,first.data.user.id);
    assert.equal((await req('/api/auth/member','','POST',{name:'ชื่อไม่ตรง',phone})).status,401);
    assert.equal((await req('/api/users',cookie)).status,403);assert.equal((await req('/api/shop/settings',cookie,'PUT',{})).status,403);
    const html=await (await fetch(base+'/member',{headers:{Cookie:'hs_session='+cookie}})).text();for(const title of ['เข้าสู่ระบบลูกค้า','ข้อมูลการจอง+สะสมแต้ม','รายละเอียดชุด','ปฏิทินจองชุด','ชำระเงิน','รีวิวลูกค้า','ติดต่อร้าน'])assert.ok(html.includes(title));
    assert.equal((await req('/api/products',staff,'POST',{id:code,name:'ชุดทดสอบชื่อเบอร์',cat:'ชุดราตรี',type:'เช่า',rent:150,stockRent:1,stockSell:0})).status,201);
    const rentalId='TEST-RENT-PHONE-'+suffix;
    const rental=await req('/api/rentals',staff,'POST',{id:rentalId,cust:name,phone,code,item:'ชุดทดสอบชื่อเบอร์',start:thaiToday(),end:new Date(Date.parse(thaiToday())+86400000).toISOString().slice(0,10),fee:150,deposit:150,status:'รับชุดแล้ว',paymentStatus:'ชำระแล้ว'});assert.equal(rental.status,201);assert.equal(rental.data.userId,first.data.user.id);
    const account=await req('/api/shop/customer-account',cookie);assert.equal(account.data.phone,phone);assert.equal(account.data.rentals[0].deposit,150);assert.ok(account.data.notifications.length>0);
    assert.equal((await req('/api/rentals/'+rentalId,staff,'PATCH',{status:'คืนแล้ว'})).status,200);assert.equal((await req('/api/shop/customer-account',cookie)).data.balance,1);
    const review=await req('/api/shop/reviews',cookie,'POST',{rentalId,text:'รีวิวจากการเช่าหน้าร้านทดสอบ',consent:true});assert.equal(review.status,201);assert.equal(review.data.approved,false);
    await db.query('INSERT INTO "User" (id,name,role,email) VALUES ($1,$2,$3,$4)',[legacyId,'บัญชีเดิม '+suffix,'ลูกค้า','legacy-'+suffix+'@example.invalid']);users.push(legacyId);
    assert.equal((await req('/api/users/'+legacyId,staff,'PATCH',{phone:phone2})).status,200);
    const legacy=await req('/api/auth/member','','POST',{name:'บัญชีเดิม '+suffix,phone:phone2});assert.equal(legacy.status,200);assert.equal(legacy.data.user.id,legacyId);
    assert.equal((await req('/api/users/'+legacyId,staff,'PATCH',{phone})).status,409);
    const bucket=Math.floor(Date.now()/300000);limitKey=createHash('sha256').update(ip+':'+phone+':'+bucket).digest('hex');await db.query('INSERT INTO "MemberLoginLimit" (key,attempts,"expiresAt") VALUES ($1,20,$2) ON CONFLICT (key) DO UPDATE SET attempts=20',[limitKey,new Date((bucket+1)*300000)]);
    assert.equal((await req('/api/auth/member','','POST',{name,phone})).status,429);
    console.log('PASS: name/phone signup, repeated login, normalization, mismatched-name refusal, staff isolation, eight menus, automatic rental link, deposit, return point, walk-in review moderation, legacy account continuity and rate limit');
  }finally{
    await db.query('BEGIN');await db.query('DELETE FROM "CustomerReview" WHERE "userId"=ANY($1::text[])',[users]);await db.query('DELETE FROM "LoyaltyEntry" WHERE "userId"=ANY($1::text[])',[users]);await db.query('DELETE FROM "NotificationRead" WHERE "userId"=ANY($1::text[])',[users]);await db.query('DELETE FROM "Rental" WHERE code=$1',[code]);await db.query('DELETE FROM "Product" WHERE id=$1',[code]);await db.query('DELETE FROM "User" WHERE id=ANY($1::text[])',[users]);for(const p of [phone,phone2])for(const bucket of [Math.floor(Date.now()/300000),Math.floor(Date.now()/300000)-1])await db.query('DELETE FROM "MemberLoginLimit" WHERE key=$1',[createHash('sha256').update(ip+':'+p+':'+bucket).digest('hex')]);await db.query('COMMIT');await db.end();console.log('Temporary phone/member data removed');
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
