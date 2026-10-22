export type ReceiptRental = {
 id:string;cust:string;phone?:string;item:string;code?:string;start:string;end:string;
 fee:number;fine?:number;damage?:number;deposit?:number;discount?:number;
 paidAmount?:number;paymentStatus?:string;status?:string;
};
const escapeHtml=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const money=(n:number)=>`${n.toLocaleString('th-TH')} บาท`;
export function rentalReceipt(r:ReceiptRental,issuedOn:string){
 const amount=(n:number|undefined)=>Math.max(0,Number(n)||0);
 // fee is already the net rental fee, including any applied discount/reward.
 const total=amount(r.fee)+amount(r.fine)+amount(r.damage);
 const paid=r.paymentStatus==='ชำระแล้ว'?total:amount(r.paidAmount);
 const balance=Math.max(0,total-paid);
 const title=paid>0?'ใบเสร็จรับเงินค่าเช่า':'ใบสรุปรายการเช่า / รอชำระเงิน';
 const row=(label:string,value:unknown)=>`<div class="row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`;
 const html=`<div class="wrap box"><div class="center"><h2>HONEY STUDIO</h2><p>${title}</p></div>
 ${row('เลขที่อ้างอิง',r.id)}${row('วันที่ออกเอกสาร',issuedOn)}${row('ลูกค้า',r.cust)}${r.phone?row('โทรศัพท์',r.phone):''}
 <div class="line"></div><p style="overflow-wrap:anywhere">${escapeHtml(r.item)}</p>${r.code?row('รหัสชุด',r.code):''}
 ${row('วันรับชุด',r.start)}${row('กำหนดคืน',r.end)}${row('สถานะการเช่า',r.status||'—')}
 <div class="line"></div>${row('ค่าเช่าสุทธิ',money(amount(r.fee)))}
 ${amount(r.discount)?row('ส่วนลดที่รวมในค่าเช่าสุทธิแล้ว',money(amount(r.discount))):''}
 ${row('ค่าปรับ',money(amount(r.fine)))}${row('ค่าเสียหาย',money(amount(r.damage)))}
 <div class="line"></div>${row('รวมค่าใช้จ่าย',money(total))}${row('รับชำระค่าใช้จ่ายแล้ว',money(paid))}${row('ค้างชำระ',money(balance))}
 <div class="line"></div>${row('เงินประกันชุดตามรายการ',money(amount(r.deposit)))}
 <p class="muted" style="font-size:12px">เงินประกันชุดแยกจากค่าใช้จ่ายข้างต้น คืนตามเงื่อนไขร้านและสภาพชุดเมื่อรับคืน จำนวนนี้ไม่ยืนยันการรับหรือคืนเงินประกัน</p>
 <p class="center">ขอบคุณที่ใช้บริการ</p></div>`;
 return {title,total,paid,balance,html};
}
