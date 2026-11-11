import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rentalsForDay} from './rental-calendar';
const today='2026-11-11';
const rental={id:'a',start:'2026-10-31',end:'2026-11-02',status:'จองแล้ว'};
test('calendar includes pickup, intermediate and return dates across month boundaries',()=>{
  assert.equal(rentalsForDay([rental],'2026-10-31',today)[0].event,'รับชุด');
  assert.equal(rentalsForDay([rental],'2026-11-01',today)[0].event,'อยู่ระหว่างเช่า');
  assert.equal(rentalsForDay([rental],'2026-11-02',today)[0].event,'คืนชุด');
  assert.equal(rentalsForDay([rental],'2026-11-03',today).length,0);
});
test('calendar excludes cancellations, supports Thai dates and retains returned history',()=>{
  const rows=[{...rental,start:'11 พ.ย. 69',end:'12 พ.ย. 69',status:'คืนแล้ว'}, {...rental,id:'cancel',start:today,status:'ยกเลิก'}, {...rental,id:'invalid',start:''}];
  const found=rentalsForDay(rows,today,today);
  assert.equal(found.length,1);assert.equal(found[0].id,'a');
  assert.equal(rentalsForDay(rows,'2026-11-12',today)[0].event,'คืนชุด');
});
test('missing return date appears only on pickup day',()=>{
  assert.equal(rentalsForDay([{...rental,start:today,end:''}],today,today).length,1);
  assert.equal(rentalsForDay([{...rental,start:today,end:''}],'2026-11-12',today).length,0);
});
