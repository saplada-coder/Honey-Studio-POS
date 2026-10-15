import assert from 'node:assert/strict';
import {createStaffRental} from '../lib/staff-rental';
import {addCustomerRental} from '../lib/customer-rental';
import {linkMemberRentals,validateMember} from '../lib/member-link';

async function main(){
  const customers: any[]=[];
  const rentals: any[]=[];
  const tx:any={
    $queryRaw:async()=>[],
    user:{upsert:async({create}:any)=>({...create,id:'member-1'})},
    customer:{
      findFirst:async({where}:any)=>customers.find(c=>Object.entries(where).every(([k,v])=>c[k]===v)),
      create:async({data}:any)=>{customers.push(data);return data;},
    },
    rental:{create:async({data}:any)=>{rentals.push(data);return data;},updateMany:async()=>({count:0})},
    product:{findUnique:async()=>({name:'ชุดทดสอบ',type:'เช่า',rent:250,stockRent:10,status:'ว่าง'}),updateMany:async()=>({count:1})},
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
  tx.rental.findMany=async()=>[];
  for(const [end,fee] of [['2026-10-11',250],['2026-10-12',300],['2026-10-15',450]] as const){
    const priced=await createStaffRental(tx,{...body,code:'dress-test',end,fee,deposit:999});
    assert.equal(priced.deposit,250,'Deposit must equal the first-day price regardless of duration or submitted deposit');
    assert.equal(priced.fee,fee);
  }
  const count=rentals.length;
  await addCustomerRental(tx,{name:'ลูกค้าไม่มีเบอร์',phone:''},{code:'dress-test',start:'2026-10-10',end:'2026-10-12',fee:300,paymentStatus:'รอชำระ'});
  assert.equal(rentals.length,count+1,'A customer can book a dress before providing a phone');
  assert.equal(rentals.at(-1).phone,'');
  assert.equal(rentals.at(-1).userId,'','No member account is linked without a phone');
  assert.equal(customers.length,2,'The booking reuses the phone-less customer');
  const claims=[
    {userId:'',online:false,cust:'ลูกค้า ทดสอบ',phone:'0891234567'},
    {userId:'',online:false,cust:'ชื่ออื่น',phone:'0891234567'},
    {userId:'',online:false,cust:'ลูกค้า ทดสอบ',phone:'0899999999'},
    {userId:'another-member',online:false,cust:'ลูกค้า ทดสอบ',phone:'0891234567'},
    {userId:'',online:true,cust:'ลูกค้า ทดสอบ',phone:'0891234567'},
    {userId:'',online:false,cust:'ลูกค้า ทดสอบ',phone:''},
  ];
  const claimTx:any={rental:{updateMany:async({where,data}:any)=>{
    let count=0;
    claims.forEach(r=>{if(Object.entries(where).every(([k,v])=>r[k]===v)){Object.assign(r,data);count++;}});
    return {count};
  }}};
  await linkMemberRentals(claimTx,{id:'member-1',name:'  ลูกค้า   ทดสอบ ',phone:'+66 89 123 4567'});
  assert.deepEqual(claims.map(r=>r.userId),['member-1','','','another-member','',''],'Claim only unlinked staff rentals with both matching name and phone');
  await linkMemberRentals(claimTx,{id:'member-2',name:'ลูกค้า ทดสอบ',phone:''});
  assert.equal(claims[5].userId,'','Never claim bookings by name alone during login');
  const staffMemberTx:any={...claimTx,user:{upsert:async({create}:any)=>({...create,id:'staff-created-member'})}};
  claims[0].userId='';
  const staffMemberId=await validateMember(staffMemberTx,'',{name:'ลูกค้า ทดสอบ',phone:'0891234567'});
  assert.equal(staffMemberId,'staff-created-member','Staff saving a phone creates membership without customer login');
  assert.equal(claims[0].userId,staffMemberId,'Existing bookings are linked immediately by the staff action');
  console.log('PASS: customer creation, phone normalization, member linking, customer reuse, invalid phone rejection and booking without a phone');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
