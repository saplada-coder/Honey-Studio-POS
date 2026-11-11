import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dashboardDate,dashboardTotals,rentalPeriodTotals} from './dashboard-totals';
const today='2026-10-16';
const rental={id:'R-1',cust:'test',start:today,end:'2026-10-18',fee:300,deposit:250,status:'จองแล้ว',paymentStatus:'ชำระแล้ว',stockReturned:false};
test('period selector isolates days, months and years with separate paid balances',()=>{
  const rows=[rental,{...rental,id:'next-day',start:'2026-10-17',paymentStatus:'รอชำระ'}, {...rental,id:'next-month',start:'2026-11-01'}, {...rental,id:'next-year',start:'2027-10-16'}, {...rental,id:'cancelled',status:'ยกเลิก'}];
  assert.equal(rentalPeriodTotals(rows,today,today).count,1);
  const month=rentalPeriodTotals(rows,today,'2026-10');
  assert.equal(month.count,2);assert.equal(month.fee,600);assert.equal(month.deposit,500);assert.equal(month.paidFee,300);assert.equal(month.paidDeposit,250);
  assert.equal(rentalPeriodTotals(rows,today,'2026').count,3);
  assert.equal(rentalPeriodTotals(rows,today,'2027').count,1);
  for(const period of ['', '202', '2026-13', '2026-09'])assert.equal(rentalPeriodTotals(rows,today,period).total,0);
});
test('monthly rentals separate fees and deposits, include unpaid and returns, and respect month and year boundaries',()=>{
  const t=dashboardTotals([
    rental,
    {...rental,id:'unpaid',start:'31 ต.ค. 69',fee:500,deposit:400,paymentStatus:'รอชำระ'},
    {...rental,id:'returned',start:'1 ต.ค. 2569',fee:0,deposit:100,status:'คืนแล้ว',stockReturned:true},
    {...rental,id:'cancelled',status:'ยกเลิก'},
    {...rental,id:'previous',start:'2026-09-30'},
    {...rental,id:'next',start:'2026-11-01'},
    {...rental,id:'last-year',start:'16 ต.ค. 68'},
    {...rental,id:'invalid',start:''},
  ],[],today);
  assert.equal(t.monthRentals.length,3);
  assert.equal(t.monthFee,800);assert.equal(t.monthDeposit,750);assert.equal(t.monthTotal,1550);
  assert.equal(t.monthPaidFee,300);assert.equal(t.monthPaidDeposit,350);
  const empty=dashboardTotals([],[],today);
  assert.equal(empty.monthTotal,0);assert.equal(empty.monthPaidDeposit,0);
});
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
