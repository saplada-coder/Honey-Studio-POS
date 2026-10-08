import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bookingDays,isDate,remainingForDates,thaiToday} from './booking-availability';
const rental=(start:string,end:string,applied=false)=>({start,end,status:'จองแล้ว',stockApplied:applied,stockReturned:false});
test('uses peak occupancy, not the sum of non-overlapping bookings',()=>{
  const p={stockRent:2,status:'ว่าง'};
  assert.equal(remainingForDates(p,[rental('2026-10-10','2026-10-12'),rental('2026-10-12','2026-10-14')],'2026-10-10','2026-10-14'),1);
  assert.equal(remainingForDates(p,[rental('2026-10-10','2026-10-13'),rental('2026-10-12','2026-10-14')],'2026-10-10','2026-10-14'),0);
});
test('includes dispatched units in capacity and releases on return day',()=>{
  assert.equal(remainingForDates({stockRent:0,status:'ว่าง'},[rental('2026-10-10','2026-10-12',true)],'2026-10-12','2026-10-13'),1);
  assert.equal(remainingForDates({stockRent:0,status:'ว่าง'},[rental('2026-10-10','2026-10-12',true)],'2026-10-11','2026-10-12'),0);
});
test('canceled and returned bookings do not block dates; repairs do',()=>{
  const reservations=[{...rental('2026-10-10','2026-10-15'),status:'ยกเลิก'},{...rental('2026-10-10','2026-10-15'),stockReturned:true,status:'คืนแล้ว'}];
  assert.equal(remainingForDates({stockRent:1,status:'ว่าง'},reservations,'2026-10-11','2026-10-12'),1);
  assert.equal(remainingForDates({stockRent:1,status:'ซ่อม'},[],'2026-10-11','2026-10-12'),0);
});
test('rejects impossible dates and invalid rental durations',()=>{
  assert.equal(isDate('2026-02-30'),false);assert.equal(isDate('2028-02-29'),true);
  assert.equal(bookingDays('2026-10-08','2026-10-11'),3);
  assert.throws(()=>bookingDays('2026-10-08','2026-10-08'));
  assert.throws(()=>bookingDays('2026-10-09','2026-10-08'));
});
test('overdue dispatched stock does not become available until returned',()=>{
  const today=thaiToday(),yesterday=new Date(Date.parse(today)-86400000).toISOString().slice(0,10),twoDaysAgo=new Date(Date.parse(today)-2*86400000).toISOString().slice(0,10),tomorrow=new Date(Date.parse(today)+86400000).toISOString().slice(0,10);
  assert.equal(remainingForDates({stockRent:0,status:'ว่าง'},[rental(twoDaysAgo,yesterday,true)],today,tomorrow),0);
});
