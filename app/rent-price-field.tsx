"use client";
import { rentalPrice } from '@/lib/product-details';
export default function RentPriceField({value,onChange,rent}:{value:string;onChange:(v:string)=>void;rent:number}) {
  let rows:{days:number;price:number}[]=[];
  try { rows=JSON.parse(value||'[]'); } catch { rows=[]; }
  const update=(next:{days:number;price:number}[])=>onChange(JSON.stringify(next));
  return <div className="space-y-2 mt-1">
    <p className="text-xs">ราคา 1 วันใช้ช่องด้านบน · วันเพิ่ม +50 บาท · เพิ่มราคาสำหรับ 3, 5 วัน หรือจำนวนวันอื่นได้</p>
    {rows.map((row,i)=><div key={i} className="flex gap-2 items-center">
      <input aria-label="จำนวนวันเช่า" type="number" min="2" step="1" required value={row.days} onChange={e=>update(rows.map((r,j)=>j===i?{...r,days:Number(e.target.value)}:r))} className="w-20 border rounded-lg p-2"/>วัน
      <input aria-label="ราคาเช่าตามวัน" type="number" min="0" step="1" required value={row.price} onChange={e=>update(rows.map((r,j)=>j===i?{...r,price:Number(e.target.value)}:r))} className="min-w-0 flex-1 border rounded-lg p-2"/>บาท
      <button type="button" onClick={()=>update(rows.filter((_,j)=>j!==i))}>ลบ</button>
    </div>)}
    <button type="button" className="border rounded-lg px-3 py-2 text-sm" onClick={()=>{const days=!rows.some(r=>r.days===3)?3:!rows.some(r=>r.days===5)?5:Math.max(5,...rows.map(r=>r.days))+1;update([...rows,{days,price:rentalPrice({rent:Number(rent)||0,rentPrices:value},days)}]);}}>+ เพิ่มจำนวนวันและราคา</button>
    <p className="text-xs">{[1,3,5].map(days=>`${days} วัน = ${rentalPrice({rent:Number(rent)||0,rentPrices:value},days).toLocaleString('th-TH')} บาท`).join(' · ')}<br/>เงินประกัน = ราคาเช่าวันแรกของชุด คงที่ทุกจำนวนวัน</p>
  </div>;
}
