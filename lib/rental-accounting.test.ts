import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rentalIncome} from './rental-accounting';
const paid={id:'R-paid',cust:'Customer',item:'Dress',fee:300,fine:0,damage:0,paymentStatus:'ชำระแล้ว',paymentSlip:'',createdAt:'2026-10-15T18:30:00Z',deposit:250};
test('paid rent becomes income without including its refundable deposit',()=>{
  const [t]=rentalIncome([paid]);assert.equal(t.amt,300);assert.equal(t.date,'2026-10-16');assert.equal(t.type,'in');assert.equal(t.sourceRentalId,paid.id);
});
test('unpaid, zero and invalid charges do not appear as income',()=>{
  assert.deepEqual(rentalIncome([{...paid,paymentStatus:'รอชำระ'},{...paid,fee:0},{...paid,fee:NaN}]),[]);
});
test('repeated reads and charge edits reflect one current source receipt',()=>{
  assert.deepEqual(rentalIncome([paid]),rentalIncome([paid]));assert.equal(rentalIncome([{...paid,fee:350,fine:50}])[0].amt,400);
});
test('existing receipts explicitly referencing the same rental are not counted twice',()=>{
  assert.deepEqual(rentalIncome([paid],[{id:'manual',desc:'ค่าเช่า R-paid · Customer',type:'in'}]),[]);
  assert.equal(rentalIncome([paid],[{id:'other',desc:'ค่าเช่า R-paid-other',type:'in'}]).length,1);
});
