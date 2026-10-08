import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {config} from 'dotenv';
import {Client} from 'pg';
import {createSession} from '../lib/auth';
config({path:'.env.local',quiet:true});
async function main(){
  const base=process.env.QR_TEST_BASE_URL||'http://127.0.0.1:3019';
  const id='TEST-QR-'+randomUUID();
  const token=await createSession({id:'test-qr',name:'ตรวจระบบ QR ชั่วคราว',role:'เจ้าของ',email:'test-qr@example.invalid'});
  const customer=await createSession({id:'test-readonly',name:'ทดสอบ',role:'ลูกค้า',email:'test-readonly@example.invalid'});
  const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect();
  const action=`/api/products/${id}/rental-actions`;
  async function request(route:string,body?:object,cookie=token){
    const response=await fetch(base+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:'hs_session='+cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {status:response.status,data:await response.json()};
  }
  try{
    const denied=await request(action,undefined,'');assert.equal(denied.status,401);
    const readonly=await request(action,undefined,customer);assert.equal(readonly.status,403);
    const created=await request('/api/products',{id,name:'ตรวจระบบ QR ชั่วคราว',cat:'ชุดราตรี',type:'เช่า',rent:300,rentPrices:JSON.stringify([{days:3,price:450},{days:5,price:650}]),stockRent:1,stockSell:0,chest:30,waist:26,hip:32,note:'ยาว 53.5 นิ้ว (135.89 ซม.)'});assert.equal(created.status,201);
    const publicPage=await fetch(base+'/p/'+id);assert.equal(publicPage.status,200);const html=await publicPage.text();assert.ok(html.includes('53.5 นิ้ว'),JSON.stringify({note:created.data.note,spec:html.slice(Math.max(0,html.indexOf('ความยาว')-80),html.indexOf('ความยาว')+300),url:publicPage.url}));assert.ok(html.includes('450'));assert.ok(html.includes('มัดจำ'));assert.ok(!html.includes('ชื่อลูกค้า'));assert.ok(html.includes('https://lin.ee/OfHxMgW'));
    const staffPage=await fetch(base+'/p/'+id,{headers:{Cookie:'hs_session='+token}});assert.ok((await staffPage.text()).includes('ชื่อลูกค้า'));
    const invalid=await request(action,{action:'rent',cust:'ทดสอบ',start:'2026-10-08',days:0});assert.equal(invalid.status,400);
    const rentals=await Promise.all([1,2].map(()=>request(action,{action:'rent',cust:'ทดสอบระบบชั่วคราว',start:'2026-10-08',days:3})));
    assert.deepEqual(rentals.map(r=>r.status).sort(),[201,409]);
    const rental=rentals.find(r=>r.status===201)!.data.rental;assert.equal(rental.fee,450);assert.equal(rental.deposit,300);assert.equal(rental.end,'2026-10-11');
    const rented=await request(action);assert.equal(rented.data.stockRent,0);assert.equal(rented.data.rentals.length,1);
    const returns=await Promise.all([1,2].map(()=>request(action,{action:'return',rentalId:rental.id,condition:'ตรวจระบบ'})));
    assert.deepEqual(returns.map(r=>r.status).sort(),[200,409]);
    const returned=await request(action);assert.equal(returned.data.stockRent,1);assert.equal(returned.data.rentals.length,0);
    const body={id:'TEST-RENT-'+randomUUID(),code:id,item:'ตรวจระบบ',cust:'ทดสอบ',start:'2026-10-08',end:'2026-10-11',fee:450,deposit:300};
    assert.equal((await request('/api/rentals',body)).status,201);
    const patches=await Promise.all([1,2].map(()=>fetch(base+'/api/rentals/'+body.id,{method:'PATCH',headers:{'Content-Type':'application/json',Cookie:'hs_session='+token},body:JSON.stringify({status:'คืนแล้ว'})})));
    assert.ok(patches.every(r=>r.status===200));assert.equal((await request(action)).data.stockRent,1);
    // Duplicate rental ID fails after claiming stock; the transaction must undo the decrement.
    assert.equal((await request('/api/rentals',body)).status,409);assert.equal((await request(action)).data.stockRent,1);
    console.log('PASS: public/staff access, configured pricing, exact measurements, invalid days, concurrent rent, concurrent return, legacy return and rollback');
  }finally{
    await client.query('BEGIN');
    await client.query('DELETE FROM "Rental" WHERE code=$1',[id]);
    await client.query('DELETE FROM "Product" WHERE id=$1',[id]);
    await client.query('COMMIT');
    await client.end();
    console.log('Temporary test product and rentals removed');
  }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
