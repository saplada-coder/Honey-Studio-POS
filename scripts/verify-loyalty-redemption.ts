import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {config} from 'dotenv';import {Client} from 'pg';import {createSession} from '../lib/auth';import {thaiToday} from '../lib/booking-availability';
config({path:'.env.local',quiet:true});
async function main(){
 const suffix=randomUUID(),uid='TEST-LOYAL-'+suffix,code='TEST-LOYAL-P-'+suffix,base='http://127.0.0.1:3019';
 const db=new Client({connectionString:process.env.DATABASE_URL,keepAlive:true});db.on('error',()=>{});await db.connect();const heartbeat=setInterval(()=>void db.query('SELECT 1').catch(()=>{}),15000);
 const staff=await createSession({id:'test-owner',name:'ทดสอบ',role:'เจ้าของ',email:'owner@example.invalid'}),customer=await createSession({id:uid,name:'ทดสอบแต้ม',role:'ลูกค้า',email:'customer@example.invalid'}),other=await createSession({id:'other-'+suffix,name:'คนอื่น',role:'ลูกค้า',email:'other@example.invalid'});
 async function req(path:string,token=customer,method='GET',body?:object){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Cookie:'hs_session='+token},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};}
 async function balance(){return (await req('/api/shop/customer-account')).data.balance;}
 async function seed(n:number,key:string){for(let i=0;i<n;i++)await db.query('INSERT INTO "LoyaltyEntry" (id,"userId","rentalId","rewardKey",points) VALUES ($1,$2,$1,$1,1)',[uid+'-'+key+'-'+i,uid]);}
 async function rent(key:string,extra:object={}){const id=uid+'-'+key;const r=await req('/api/rentals',staff,'POST',{id,userId:uid,code,item:'ทดสอบสิทธิ์ฟรี',cust:'ทดสอบแต้ม',start:thaiToday(),end:new Date(Date.parse(thaiToday())+86400000).toISOString().slice(0,10),fee:350,deposit:350,status:'จองแล้ว',...extra});assert.equal(r.status,201);return id;}
 try{
  await db.query('INSERT INTO "User" (id,name,role,email) VALUES ($1,$2,$3,$4)',[uid,'ทดสอบแต้ม','ลูกค้า',uid+'@example.invalid']);
  const html=await (await fetch(base+'/')).text();const nav=html.match(/<nav[^>]*>[\s\S]*?<\/nav>/)?.[0]||'';for(const title of ['เข้าสู่ระบบลูกค้า','ข้อมูลการจอง+สะสมแต้ม','รายละเอียดชุด','ปฏิทินจองชุด','ชำระเงิน','รีวิวลูกค้า','ติดต่อร้าน'])assert.ok(nav.includes(title));assert.ok(!nav.includes('หน้าแรก'));assert.ok(!nav.includes('ชุดเช่าทั้งหมด'));
  assert.equal((await req('/api/products',staff,'POST',{id:code,name:'ทดสอบสิทธิ์สมาชิก',cat:'ชุดราตรี',type:'เช่า',rent:350,stockRent:6,stockSell:0})).status,201);
  await seed(9,'initial');const earned=await rent('earn',{status:'รับชุดแล้ว',paymentStatus:'ชำระแล้ว'});
  assert.equal((await req('/api/rentals/'+earned,staff,'PATCH',{fine:100})).status,200);
  assert.equal((await req('/api/rentals/'+earned,staff,'PATCH',{status:'คืนแล้ว'})).status,200);assert.equal(await balance(),9);
  assert.equal((await req('/api/rentals/'+earned,staff,'PATCH',{action:'settle'})).status,200);assert.equal(await balance(),10);
  assert.equal((await req('/api/rentals/'+earned,staff,'PATCH',{action:'settle'})).status,200);assert.equal(await balance(),10);
  const a=await rent('a'),b=await rent('b'),over=await rent('over',{fee:351});
  assert.equal((await req('/api/shop/loyalty/redeem',other,'POST',{rentalId:a})).status,409);
  assert.equal((await req('/api/shop/loyalty/redeem',customer,'POST',{rentalId:over})).status,409);
  assert.equal((await req('/api/rentals/'+over,staff,'PATCH',{fee:350,promotion:'bogo'})).status,200);
  assert.equal((await req('/api/shop/loyalty/redeem',customer,'POST',{rentalId:over})).status,409);
  const attempts=await Promise.all([a,b].map(rentalId=>req('/api/shop/loyalty/redeem',customer,'POST',{rentalId})));assert.deepEqual(attempts.map(r=>r.status).sort(),[200,409]);const winner=[a,b][attempts.findIndex(r=>r.status===200)],free=attempts.find(r=>r.status===200)!.data;
  assert.equal(free.fee,0);assert.equal(free.deposit,350);assert.equal(await balance(),0);
  assert.equal((await req('/api/rentals/'+winner,staff,'PATCH',{userId:'other'})).status,409);
  assert.equal((await req('/api/rentals/'+winner,staff,'PATCH',{action:'settle'})).status,200);assert.equal((await req('/api/rentals/'+winner,staff,'PATCH',{status:'รับชุดแล้ว'})).status,200);assert.equal((await req('/api/rentals/'+winner,staff,'PATCH',{status:'คืนแล้ว'})).status,200);assert.equal(await balance(),0);
  const group='GROUP-'+suffix,g1=await rent('group1',{loyaltyGroup:group,paymentStatus:'ชำระแล้ว',status:'รับชุดแล้ว'}),g2=await rent('group2',{loyaltyGroup:group,paymentStatus:'ชำระแล้ว',status:'รับชุดแล้ว'});
  assert.equal((await req('/api/rentals/'+g1,staff,'PATCH',{status:'คืนแล้ว'})).status,200);assert.equal(await balance(),0);
  assert.equal((await req('/api/rentals/'+g2,staff,'PATCH',{status:'คืนแล้ว'})).status,200);assert.equal(await balance(),1);
  await seed(9,'refund');const cancelled=await rent('cancel');assert.equal((await req('/api/shop/loyalty/redeem',customer,'POST',{rentalId:cancelled})).status,200);assert.equal(await balance(),0);
  assert.equal((await req('/api/rentals/'+cancelled,staff,'PATCH',{status:'ยกเลิก'})).status,200);assert.equal(await balance(),10);
  assert.equal((await req('/api/rentals/'+cancelled,staff,'DELETE')).status,200);assert.equal(await balance(),10);
  console.log('PASS: exact seven menus, no home/catalog, return-and-settle eligibility, concurrent redemption without overspending, price cap, unchanged deposit, no transfer/free-rental points, one point per multi-dress transaction and single cancellation refund');
 }finally{clearInterval(heartbeat);await db.end().catch(()=>{});const clean=new Client({connectionString:process.env.DATABASE_URL});await clean.connect();try{await clean.query('BEGIN');await clean.query('DELETE FROM "LoyaltyEntry" WHERE "userId"=$1',[uid]);await clean.query('DELETE FROM "Rental" WHERE code=$1',[code]);await clean.query('DELETE FROM "Product" WHERE id=$1',[code]);await clean.query('DELETE FROM "User" WHERE id=$1',[uid]);await clean.query('COMMIT');}finally{await clean.end();}console.log('Temporary loyalty data removed');}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
