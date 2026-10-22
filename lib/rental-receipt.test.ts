import test from 'node:test';
import assert from 'node:assert/strict';
import {rentalReceipt} from './rental-receipt';
const rental={id:'R-1',cust:'ลูกค้า',item:'ชุด',start:'2026-10-22',end:'2026-10-25',fee:250,discount:50,deposit:1000,fine:20,damage:30};
test('net fee is not discounted again and deposit is separate',()=>{
 const r=rentalReceipt({...rental,paymentStatus:'ชำระแล้ว',paidAmount:250},'22/10/2569');
 assert.equal(r.total,300);assert.equal(r.paid,300);assert.equal(r.balance,0);
});
test('unpaid and partial payments use recorded amounts',()=>{
 assert.equal(rentalReceipt(rental,'วันนี้').title,'ใบสรุปรายการเช่า / รอชำระเงิน');
 const r=rentalReceipt({...rental,paidAmount:100},'วันนี้');
 assert.equal(r.paid,100);assert.equal(r.balance,200);
});
test('customer content is escaped for printable HTML',()=>{
 const r=rentalReceipt({...rental,cust:'<script>alert(1)</script>'},'วันนี้');
 assert.ok(!r.html.includes('<script>'));assert.ok(r.html.includes('&lt;script&gt;'));
});
