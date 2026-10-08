export function isDate(value:string):boolean {return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
export function thaiToday(){return new Date(Date.now()+7*3600000).toISOString().slice(0,10);}
export function bookingDays(start:string,end:string){if(!isDate(start)||!isDate(end))throw new Error('เลือกวันที่รับและคืนให้ถูกต้อง');const days=(Date.parse(end)-Date.parse(start))/86400000;if(days<1||days>365)throw new Error('วันคืนต้องอยู่หลังวันรับ 1–365 วัน');return days;}
export type CalendarRental={start:string;end:string;stockApplied:boolean;stockReturned:boolean;status:string};
export function remainingForDates(product:{stockRent:number;status:string},rentals:CalendarRental[],start:string,end:string){
  if(['ซัก','ซ่อม','ปลดสต็อก'].includes(product.status))return 0;
  const active=rentals.filter(r=>!['คืนแล้ว','ยกเลิก'].includes(r.status)&&!r.stockReturned&&isDate(r.start)&&isDate(r.end)&&r.end>r.start).map(r=>({...r,end:r.stockApplied&&r.end<=thaiToday()?'9999-12-31':r.end}));
  const capacity=product.stockRent+active.filter(r=>r.stockApplied).length;
  const events:[string,number][]=[];
  for(const r of active){if(r.start<end&&r.end>start){events.push([r.start<start?start:r.start,1],[r.end>end?end:r.end,-1]);}}
  events.sort((a,b)=>a[0].localeCompare(b[0])||a[1]-b[1]);
  let used=0,peak=0;for(const [,delta] of events){used+=delta;peak=Math.max(peak,used);}
  return Math.max(0,capacity-peak);
}
