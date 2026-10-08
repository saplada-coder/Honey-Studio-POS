"use client";
import {useEffect,useState} from 'react';
import {rentalPrice} from '@/lib/product-details';
type Rental={id:string;cust:string;start:string;end:string;status:string};
export default function RentalControls({product}:{product:{id:string;rent:number;rentPrices:string;type:string}}){
  const [stock,setStock]=useState<{stockRent:number;stockSell:number;status:string;rentals:Rental[]}|null>(null);
  const [cust,setCust]=useState(''),[phone,setPhone]=useState(''),[days,setDays]=useState(1),[start,setStart]=useState(()=>new Date(Date.now()+7*3600000).toISOString().slice(0,10));
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const url=`/api/products/${encodeURIComponent(product.id)}/rental-actions`;
  async function load(){const response=await fetch(url,{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error||'โหลดสต๊อกไม่สำเร็จ');setStock(data);}
  useEffect(()=>{load().catch(e=>setError(e.message));},[url]);
  async function act(body:object){setBusy(true);setError('');setMessage('');try{const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error||'บันทึกไม่สำเร็จ');setMessage('บันทึกแล้ว');await load();}catch(e){setError(e instanceof Error?e.message:'บันทึกไม่สำเร็จ');}finally{setBusy(false);}}
  return <section className="mt-5 border rounded-xl p-3 space-y-3">
    <h2 className="font-bold">เช็คสต๊อก · เช่า · คืน</h2>
    {stock?<p>คลังเช่า {stock.stockRent} ตัว · คลังขาย {stock.stockSell} ตัว · {stock.status}</p>:<p>กำลังตรวจสต๊อก…</p>}
    <button disabled={busy} type="button" onClick={()=>load().catch(e=>setError(e.message))} className="underline text-sm">ตรวจสต๊อกล่าสุด</button>
    {['เช่า','ทั้งคู่'].includes(product.type)&&<form className="space-y-2" onSubmit={e=>{e.preventDefault();act({action:'rent',cust,phone,days,start});}}>
      <label className="block text-sm">ชื่อลูกค้า<input required maxLength={200} value={cust} onChange={e=>setCust(e.target.value)} className="w-full border rounded-lg p-2"/></label>
      <label className="block text-sm">โทรศัพท์<input maxLength={40} value={phone} onChange={e=>setPhone(e.target.value)} className="w-full border rounded-lg p-2"/></label>
      <label className="block text-sm">วันที่รับ<input required type="date" value={start} onChange={e=>setStart(e.target.value)} className="w-full border rounded-lg p-2"/></label>
      <label className="block text-sm">จำนวนวัน<input required type="number" min={1} max={365} step={1} value={days} onChange={e=>setDays(Number(e.target.value))} className="w-full border rounded-lg p-2"/></label>
      <p>ค่าเช่า {rentalPrice(product,days).toLocaleString('th-TH')} บาท · มัดจำ {product.rent.toLocaleString('th-TH')} บาท</p>
      <button disabled={busy||!stock||stock.stockRent<1||['ซัก','ซ่อม','ปลดสต็อก'].includes(stock.status)} className="w-full p-3 rounded-lg bg-amber-100 disabled:opacity-50">{busy?'กำลังบันทึก…':'ยืนยันเช่า / ส่งชุด'}</button>
    </form>}
    {stock?.rentals.map(r=><form key={r.id} className="border-t pt-3 space-y-2" onSubmit={e=>{e.preventDefault();const condition=String(new FormData(e.currentTarget).get('condition')||'');act({action:'return',rentalId:r.id,condition});}}>
      <p className="font-semibold">รับคืนจาก {r.cust}</p><p className="text-xs">วันรับ {r.start} · กำหนดคืน {r.end} · {r.status}</p>
      <input name="condition" aria-label="สภาพชุดหลังคืน" maxLength={1000} placeholder="สภาพชุดหลังคืน" className="w-full border rounded-lg p-2"/>
      <button disabled={busy} className="w-full p-3 rounded-lg bg-green-100 disabled:opacity-50">ยืนยันรับคืน</button>
    </form>)}
    {message&&<p role="status" className="text-green-700">{message}</p>}{error&&<p role="alert" className="text-red-700">{error}</p>}
  </section>;
}
