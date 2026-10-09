import assert from 'node:assert/strict';
import {createStaffRental} from '../lib/staff-rental';

async function main(){
  const customers: any[]=[];
  const tx:any={
    $queryRaw:async()=>[],
    user:{upsert:async({create}:any)=>({...create,id:'member-1'})},
    customer:{
      findFirst:async({where}:any)=>customers.find(c=>Object.entries(where).every(([k,v])=>c[k]===v)),
      create:async({data}:any)=>{customers.push(data);return data;},
    },
    rental:{create:async({data}:any)=>data},
  };
  const body={id:'R-test',cust:'  ลูกค้า   ทดสอบ  ',phone:'+66 89 123 4567',item:'ชุดทดสอบ',start:'2026-10-10',end:'2026-10-12',fee:300};
  const rental=await createStaffRental(tx,body);
  assert.equal(customers.length,1);
  assert.equal(customers[0].phone,'0891234567');
  assert.equal(rental.cust,'ลูกค้า ทดสอบ');
  assert.equal(rental.phone,customers[0].phone);
  assert.equal(rental.userId,'member-1');
  await createStaffRental(tx,{...body,id:'R-test-2',phone:'0891234567'});
  assert.equal(customers.length,1,'Repeat rentals must reuse the customer');
  await assert.rejects(()=>createStaffRental(tx,{...body,phone:'invalid'}),/เบอร์โทร/);
  assert.equal(customers.length,1);
  await createStaffRental(tx,{...body,cust:'ลูกค้าไม่มีเบอร์',phone:''});
  await createStaffRental(tx,{...body,cust:'ลูกค้าไม่มีเบอร์',phone:''});
  assert.equal(customers.length,2,'Phone-less customers are matched by their exact normalized name');
  console.log('PASS: customer creation, phone normalization, member linking, customer reuse and invalid phone rejection');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
