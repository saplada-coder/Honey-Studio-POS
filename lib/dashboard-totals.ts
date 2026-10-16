const months=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
export function dashboardDate(value: string, today: string): string {
  const text=String(value||'').trim();
  if(/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(text))return text.slice(0,10);
  const match=text.match(/^(\d{1,2})\s+([^\s]+)(?:\s+(\d{2,4}))?$/);
  if(!match)return '';
  const month=months.indexOf(match[2]);if(month<0)return '';
  let year=match[3]?Number(match[3]):Number(today.slice(0,4));
  if(match[3]?.length===2)year+=2500;
  if(year>2400)year-=543;
  const iso=`${year}-${String(month+1).padStart(2,'0')}-${match[1].padStart(2,'0')}`;
  return Number.isFinite(Date.parse(iso))&&new Date(iso).toISOString().slice(0,10)===iso?iso:'';
}
type Rental={id:string;cust?:string;item?:string;start:string;end:string;fee:number;deposit:number;status:string;paymentStatus:string;stockReturned?:boolean};
type Order={type:string;date:string;total:number;status:string};
export function dashboardTotals(rentals:Rental[],orders:Order[],today:string){
  const active=(r:Rental)=>!['คืนแล้ว','ยกเลิก'].includes(r.status)&&!r.stockReturned;
  const rentOn=(day:string)=>rentals.filter(r=>r.status!=='ยกเลิก'&&r.paymentStatus==='ชำระแล้ว'&&dashboardDate(r.start,today)===day);
  const salesOn=(day:string)=>orders.filter(o=>o.type==='ขาย'&&o.status!=='ยกเลิก'&&dashboardDate(o.date,today)===day);
  const sum=(rows:object[],field:string)=>rows.reduce((s,r)=>s+(Number((r as Record<string,unknown>)[field])||0),0);
  const held=rentals.filter(r=>active(r)&&r.paymentStatus==='ชำระแล้ว'&&r.deposit>0);
  const due=held.filter(r=>{const date=dashboardDate(r.end,today);return !!date&&date<=today;}).sort((a,b)=>dashboardDate(a.end,today).localeCompare(dashboardDate(b.end,today)));
  const rentToday=rentOn(today),sellToday=salesOn(today);
  const rentTotal=sum(rentToday,'fee'),sellTotal=sum(sellToday,'total');
  return {rentToday,sellToday,rentTotal,sellTotal,total:rentTotal+sellTotal,held,due,depositTotal:sum(held,'deposit'),depositDue:sum(due,'deposit'),
    revenue:Array.from({length:7},(_,i)=>{const date=new Date(today+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-(6-i));const day=date.toISOString().slice(0,10);return {d:['อา','จ','อ','พ','พฤ','ศ','ส'][date.getUTCDay()],เช่า:sum(rentOn(day),'fee'),ขาย:sum(salesOn(day),'total')};})};
}
