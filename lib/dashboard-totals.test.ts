import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dashboardDate,dashboardTotals} from './dashboard-totals';
const today='2026-10-16';
const rental={id:'R-1',cust:'test',start:today,end:'2026-10-18',fee:300,deposit:250,status:'จองแล้ว',paymentStatus:'ชำระแล้ว',stockReturned:false};
test('matches ISO and Thai dates without mixing years',()=>{
  for(const text of [today,'16 ต.ค.','16 ต.ค. 69','16 ต.ค. 2569','16 ต.ค. 2026'])assert.equal(dashboardDate(text,today),today);
  assert.equal(dashboardDate('16 ต.ค. 68',today),'2025-10-16');
  assert.equal(dashboardDate('31 ก.พ. 69',today),'');
});
test('counts paid rent and sales in daily totals and the seven-day chart, excluding deposits',()=>{
  const t=dashboardTotals([rental,{...rental,id:'unpaid',paymentStatus:'รอชำระ'},{...rental,id:'cancelled',status:'ยกเลิก'}],[{type:'ขาย',date:'16 ต.ค. 69',total:100,status:'สำเร็จ'},{type:'ขาย',date:today,total:999,status:'ยกเลิก'}],today);
  assert.equal(t.total,400);assert.equal(t.rentTotal,300);assert.equal(t.sellTotal,100);
  assert.equal(t.depositTotal,250);assert.equal(t.depositDue,0);
  assert.deepEqual(t.revenue.at(-1),{d:'ศ',เช่า:300,ขาย:100});
});
test('deposits stop being held when the dress is returned; overdue refunds remain due',()=>{
  const t=dashboardTotals([{...rental,end:today},{...rental,id:'late',end:'2026-10-15'},{...rental,id:'returned',status:'คืนแล้ว'},{...rental,id:'stock-returned',stockReturned:true}],[],today);
  assert.equal(t.depositTotal,500);assert.equal(t.depositDue,500);assert.equal(t.due.length,2);
});
