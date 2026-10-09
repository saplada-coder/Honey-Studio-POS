"use client";
import {useEffect,useState} from 'react';
type Entry={id:string;kind:string;productId:string;name:string;createdAt:string;snapshot:{image?:string;imageBack?:string;url?:string;field?:string}};
type Product={id:string;name:string};
export default function StockTrash({products,onChange}:{products:Product[];onChange:()=>Promise<void>}){
  const [entries,setEntries]=useState<Entry[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(''),[query,setQuery]=useState('');
  const [targets,setTargets]=useState<Record<string,string>>({}),[fields,setFields]=useState<Record<string,string>>({});
  async function load(){const response=await fetch('/api/stock-trash',{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error);setEntries(data);}
  useEffect(()=>{load().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  async function restore(entry:Entry){
    setBusy(entry.id);setError('');setMessage('');
    try{
      const response=await fetch('/api/stock-trash',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:entry.id,productId:targets[entry.id],field:fields[entry.id]||'image'})});
      const data=await response.json();if(!response.ok)throw Error(data.error);
      await Promise.all([load(),onChange()]);setMessage('กู้คืนแล้ว');
    }catch(e){setError(e instanceof Error?e.message:'กู้คืนไม่สำเร็จ');}finally{setBusy('');}
  }
  const filtered=entries.filter(entry=>(entry.name+' '+entry.productId).toLowerCase().includes(query.toLowerCase()));
  return <section className="space-y-4">
    <h1 className="text-xl font-bold">ถังขยะ / รูปที่กู้คืน</h1>
    <p className="text-sm text-stone-600">สินค้าและรูปที่ลบจะเก็บไว้ที่นี่เพื่อกู้คืน รูปเก่าที่ไม่มีรหัสสินค้าให้เลือกสินค้าปลายทางก่อน ระบบจะไม่ทับรูปที่มีอยู่</p>
    <input className="w-full border rounded-xl p-3" placeholder="ค้นหาชื่อ / รหัสสินค้า / ชื่อไฟล์รูป" value={query} onChange={e=>setQuery(e.target.value)}/>
    {error&&<p role="alert" className="text-red-700">{error}</p>}{message&&<p role="status" className="text-green-700">{message}</p>}
    {loading?<p>กำลังโหลด…</p>:<p className="text-sm">{filtered.length} รายการ</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(entry=><article key={entry.id} className="bg-white rounded-xl border p-4 space-y-3">
      {(entry.snapshot.url||entry.snapshot.image||entry.snapshot.imageBack)&&<a href={entry.snapshot.url||entry.snapshot.image||entry.snapshot.imageBack} target="_blank" rel="noreferrer"><img loading="lazy" src={entry.snapshot.url||entry.snapshot.image||entry.snapshot.imageBack} alt={entry.name} className="w-full h-52 object-contain"/></a>}
      <h2 className="font-semibold text-sm break-words">{entry.name}</h2>
      <p className="text-xs text-stone-500">{entry.kind==='product'?'สินค้าที่ลบ':entry.kind==='recovered-photo'?'รูปที่กู้จากคลัง':'รูปที่ลบ'}{entry.productId?' · '+entry.productId:''}</p>
      {entry.kind!=='product'&&!entry.productId&&<>
        <select aria-label="สินค้าปลายทาง" className="w-full border rounded-lg p-2 text-sm" value={targets[entry.id]||''} onChange={e=>setTargets(t=>({...t,[entry.id]:e.target.value}))}><option value="">เลือกสินค้าเพื่อผูกรูปกลับ</option>{products.map(product=><option key={product.id} value={product.id}>{product.id} · {product.name}</option>)}</select>
        <select aria-label="ตำแหน่งรูป" className="w-full border rounded-lg p-2 text-sm" value={fields[entry.id]||'image'} onChange={e=>setFields(f=>({...f,[entry.id]:e.target.value}))}><option value="image">รูปด้านหน้า / รูปสินค้า</option><option value="imageBack">รูปด้านหลัง / รูปเพิ่มเติม</option><option value="defects">รูปตำหนิ</option></select>
      </>}
      <button className="w-full bg-[#d4af37] text-white rounded-lg p-2 disabled:opacity-50" disabled={!!busy||entry.kind!=='product'&&!entry.productId&&!targets[entry.id]} onClick={()=>restore(entry)}>{busy===entry.id?'กำลังกู้คืน…':'กู้คืน'}</button>
    </article>)}</div>
    {!loading&&!entries.length&&<p>ไม่มีรายการในถังขยะ</p>}
  </section>;
}
