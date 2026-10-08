import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {config} from 'dotenv';
import {Client} from 'pg';
import {createSession} from '../lib/auth';
import {thaiToday} from '../lib/booking-availability';
config({path:'.env.local',quiet:true});
async function main(){
  const base='http://127.0.0.1:3019',id='TEST-ONLINE-'+randomUUID();
  const owner=await createSession({id:'test-owner',name:'ทดสอบร้าน',role:'เจ้าของ',email:'owner@example.invalid'});
  const customers=await Promise.all([1,2].map(i=>createSession({id:'test-customer-'+id+'-'+i,name:'ลูกค้าทดสอบ'+i,role:'ลูกค้า',email:'customer'+i+'@example.invalid'})));
  const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect();
  async function request(path:string,token='',method='GET',body?:object){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Cookie:'hs_session='+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();return {status:r.status,data};}
  const start=new Date(Date.parse(thaiToday())+10*86400000).toISOString().slice(0,10),end=new Date(Date.parse(start)+3*86400000).toISOString().slice(0,10);
  try{
    const home=await fetch(base+'/');assert.equal(home.status,200);const html=await home.text();for(const title of ['ชุดเช่าทั้งหมด','ปฏิทินจองชุด','จองชุดออนไลน์','ชำระเงิน','ตรวจสอบการจอง','รีวิวลูกค้า','ติดต่อร้าน'])assert.ok(html.includes(title));
    const staffRedirect=await fetch(base+'/staff',{headers:{Cookie:'hs_session='+customers[0]},redirect:'manual'});assert.equal(staffRedirect.status,307);
    assert.equal((await request('/api/shop/bookings')).status,401);assert.equal((await request('/api/shop/customer-account')).status,401);assert.ok(html.includes('https://lin.ee/OfHxMgW'));
    assert.equal((await request('/api/shop/settings',customers[0],'PUT',{})).status,403);
    assert.equal((await request('/api/products',owner,'POST',{id,name:'ทดสอบจองออนไลน์ชั่วคราว',cat:'ชุดราตรี',type:'เช่า',rent:300,rentPrices:'[{"days":3,"price":450}]',stockRent:1,stockSell:0})).status,201);
    const attempts=await Promise.all(customers.map((token,i)=>request('/api/shop/bookings',token,'POST',{code:id,cust:'ลูกค้าทดสอบ'+i,phone:'0891234567',start,end})));
    assert.deepEqual(attempts.map(r=>r.status).sort(),[201,409]);const winner=attempts.findIndex(r=>r.status===201),booking=attempts[winner].data,token=customers[winner],other=customers[1-winner];
    const before=await request('/api/shop/customer-account',token);assert.equal(before.data.balance,0);assert.ok(before.data.notifications.length>0);const notice=before.data.notifications[0].id;assert.equal((await request('/api/shop/customer-account',token,'PATCH',{ids:[notice]})).status,200);assert.equal((await request('/api/shop/customer-account',token)).data.notifications.find((n:{id:string})=>n.id===notice).read,true);assert.equal((await request('/api/shop/customer-account',other)).data.notifications.length,0);assert.equal(booking.fee,450);assert.equal(booking.deposit,300);assert.equal(booking.stockApplied,false);
    const current=(await client.query('SELECT "stockRent" FROM "Product" WHERE id=$1',[id])).rows[0];assert.equal(current.stockRent,1);
    assert.equal((await request('/api/shop/bookings',other)).data.some((b:{id:string})=>b.id===booking.id),false);
    assert.equal((await request('/api/shop/bookings/'+booking.id,other,'PATCH',{action:'cancel'})).status,409);
    assert.equal((await request('/api/shop/bookings/'+booking.id,token,'PATCH',{action:'paid'})).status,409);
    const availability=await request(`/api/shop/products/${id}/availability?start=${start}&end=${end}`);assert.equal(availability.data.remaining,0);assert.ok(!JSON.stringify(availability.data).includes('cust'));
    assert.equal((await request(`/api/products/${id}/rental-actions`,owner,'POST',{action:'rent',cust:'ทดสอบหน้าร้าน',start,days:3})).status,409);
    assert.equal((await request('/api/rentals/'+booking.id,owner,'PATCH',{status:'รับชุดแล้ว'})).status,409);
    await client.query('UPDATE "Rental" SET "paymentSlip"=$2,"paymentStatus"=$3 WHERE id=$1',[booking.id,'https://example.invalid/test-slip.png','รอตรวจสอบ']);
    assert.equal((await request('/api/shop/bookings/'+booking.id,owner,'PATCH',{action:'paid'})).status,200);
    await client.query('UPDATE "Rental" SET start=$2 WHERE id=$1',[booking.id,thaiToday()]);
    assert.ok((await request('/api/shop/customer-account',token)).data.notifications.some((n:{title:string})=>n.title==='วันนี้ถึงคิวรับชุด'));
    await client.query('UPDATE "Rental" SET start=$2 WHERE id=$1',[booking.id,start]);
    assert.equal((await request('/api/rentals/'+booking.id,owner,'PATCH',{status:'รับชุดแล้ว'})).status,200);
    assert.equal((await client.query('SELECT "stockRent" FROM "Product" WHERE id=$1',[id])).rows[0].stockRent,0);
    const yesterday=new Date(Date.parse(thaiToday())-86400000).toISOString().slice(0,10);
    await client.query('UPDATE "Rental" SET "end"=$2 WHERE id=$1',[booking.id,yesterday]);
    assert.ok((await request('/api/shop/customer-account',token)).data.notifications.some((n:{title:string})=>n.title==='เลยกำหนดคืนชุด'));
    await client.query('UPDATE "Rental" SET "end"=$2 WHERE id=$1',[booking.id,end]);
    assert.equal((await request('/api/shop/reviews',token,'POST',{rentalId:booking.id,text:'รีวิวทดสอบ',consent:true})).status,403);
    assert.equal((await request(`/api/products/${id}/rental-actions`,owner,'POST',{action:'return',rentalId:booking.id})).status,200);
    assert.equal((await request('/api/shop/customer-account',token)).data.balance,1);assert.equal((await request('/api/shop/customer-account',other)).data.balance,0);assert.equal((await request(`/api/products/${id}/rental-actions`,owner,'POST',{action:'return',rentalId:booking.id})).status,409);assert.equal((await request('/api/rentals/'+booking.id,owner,'PATCH',{status:'คืนแล้ว'})).status,200);assert.equal((await request('/api/shop/customer-account',token)).data.balance,1);await client.query('UPDATE "Rental" SET "end"=$2,"stockReturned"=false,"stockApplied"=true,"status"=$3 WHERE id=$1',[booking.id,thaiToday(),'รับชุดแล้ว']);assert.ok((await request('/api/shop/customer-account',token)).data.notifications.some((n:{title:string})=>n.title==='วันนี้ครบกำหนดคืนชุด'));await client.query('UPDATE "Rental" SET "stockReturned"=true,"status"=$2 WHERE id=$1',[booking.id,'คืนแล้ว']);assert.equal((await request('/api/shop/reviews',token,'POST',{rentalId:booking.id,text:'รีวิวทดสอบ',consent:false})).status,400);
    const review=await request('/api/shop/reviews',token,'POST',{rentalId:booking.id,text:'รีวิวทดสอบชั่วคราว',consent:true});assert.equal(review.status,201);
    assert.equal((await request('/api/shop/reviews')).data.some((r:{id:string})=>r.id===review.data.id),false);
    assert.equal((await request('/api/shop/reviews',owner,'PATCH',{id:review.data.id,approved:true})).status,200);
    assert.equal((await request('/api/shop/reviews')).data.some((r:{id:string})=>r.id===review.data.id),true);
    console.log('PASS: storefront, customer isolation, booking collision, payment, return, consent/moderation, private notifications, read receipts, return-day reminder, one loyalty point per return and LINE link');
  }finally{
    await client.query('BEGIN');await client.query('DELETE FROM "NotificationRead" WHERE "userId" LIKE $1',['test-customer-'+id+'-%']);await client.query('DELETE FROM "LoyaltyEntry" WHERE "rentalId" IN (SELECT id FROM "Rental" WHERE code=$1)',[id]);await client.query('DELETE FROM "CustomerReview" WHERE "rentalId" IN (SELECT id FROM "Rental" WHERE code=$1)',[id]);await client.query('DELETE FROM "Rental" WHERE code=$1',[id]);await client.query('DELETE FROM "Product" WHERE id=$1',[id]);await client.query('COMMIT');await client.end();console.log('Temporary storefront test data removed');
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
