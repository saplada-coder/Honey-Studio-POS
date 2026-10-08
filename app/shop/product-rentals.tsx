"use client";
import {useEffect,useState} from 'react';
type Rental={id:string;cust:string;phone:string;start:string;end:string;status:string;paymentStatus:string;fee:number;discount:number;deposit:number};
const money=(n:number)=>n.toLocaleString('th-TH')+' บาท';
export default function ProductRentals({productId,user}:{productId:string;user:{staff:boolean}|null}){
  const [rentals,setRentals]=useState<Rental[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
  useEffect(()=>{
    if(!user)return;
    const controller=new AbortController();setLoading(true);setRentals([]);setError('');
    fetch('/api/shop/products/'+encodeURIComponent(productId)+'/rentals',{cache:'no-store',signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||'โหลดข้อมูลไม่สำเร็จ');return data.rentals;}).then(data=>{if(!controller.signal.aborted)setRentals(data);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[productId,user]);
  if(!user)return <section className="shop-panel mt-6"><h2 className="font-semibold">รายการเช่าชุดนี้ของคุณ</h2><a href="/customer-login" className="inline-block mt-3 underline">เข้าสู่ระบบเพื่อดูข้อมูลการเช่าของคุณ</a></section>;
  return <section className="mt-6"><h2 className="text-xl font-semibold mb-4">{user.staff?'ข้อมูลลูกค้าที่เช่าชุดนี้':'รายการเช่าชุดนี้ของคุณ'}</h2>{loading?<p className="shop-panel">กำลังโหลด…</p>:error?<p className="shop-panel text-rose-700" role="alert">{error}</p>:!rentals.length?<p className="shop-panel">{user.staff?'ยังไม่มีรายการเช่าชุดนี้':'คุณยังไม่มีรายการเช่าชุดนี้'}</p>:<div className="grid md:grid-cols-2 gap-4">{rentals.map(r=><article key={r.id} className="shop-panel space-y-2 text-sm"><div className="flex justify-between gap-3"><h3 className="font-semibold">{r.cust}</h3><span>{r.status}</span></div><p className="text-xs text-stone-500 break-all">เลขที่รายการ {r.id}</p><p>เบอร์โทร {r.phone?<a className="underline" href={'tel:'+r.phone.replace(/[^+\d]/g,'')}>{r.phone}</a>:'ไม่ได้ระบุ'}</p><div className="grid grid-cols-2 gap-3"><p>วันรับชุด {r.start}</p><p>กำหนดคืน {r.end}</p></div>{r.discount>0&&<p>ส่วนลดค่าเช่า {money(r.discount)}</p>}<p>ค่าเช่าสุทธิ {money(r.fee)} · เงินประกัน {money(r.deposit)}</p><p>ชำระเงิน: {r.paymentStatus}</p></article>)}</div>}</section>;
}
