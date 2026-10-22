'use client';
import {useEffect,useRef,useState} from 'react';
import {emptyDressCriteria,parseDressRequest,type DressCriteria} from '@/lib/dress-finder';
type Recognition={lang:string;interimResults:boolean;onresult:((e:any)=>void)|null;onerror:((e:any)=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
export default function DressFinder({value,onChange}:{value:DressCriteria;onChange:(value:DressCriteria)=>void}){
 const [supported,setSupported]=useState(false),[listening,setListening]=useState(false),[message,setMessage]=useState(''),[spoken,setSpoken]=useState('');
 const recognition=useRef<Recognition|null>(null);
 useEffect(()=>{const w=window as any;setSupported(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));return()=>recognition.current?.abort();},[]);
 const update=(key:keyof DressCriteria,v:string|number|boolean)=>onChange({...value,[key]:v});
 function listen(){
  if(listening){recognition.current?.stop();return;}
  const w=window as any;const Constructor=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Constructor)return;
  const r:Recognition=new Constructor();recognition.current=r;r.lang='th-TH';r.interimResults=false;
  r.onresult=e=>{const text=e.results[0][0].transcript;setSpoken(text);const result=parseDressRequest(text);if(result.recognized){onChange(result.criteria);setMessage('เลือกเงื่อนไขจากเสียงแล้ว ตรวจหรือปรับปุ่มด้านล่างได้');}else setMessage('ยังจับเงื่อนไขไม่ได้ ลองพูด “ชุดสีเขียว ไซส์เอ็ม” หรือเลือกปุ่มด้านล่าง');};
  r.onerror=e=>{setListening(false);setMessage(e.error==='not-allowed'?'กรุณาอนุญาตไมโครโฟน หรือเลือกเงื่อนไขด้านล่าง':'รับเสียงไม่สำเร็จ ลองอีกครั้งหรือเลือกเงื่อนไขด้านล่าง');};
  r.onend=()=>setListening(false);
  try{r.start();setListening(true);setMessage('กำลังฟัง…');}catch{setMessage('เปิดไมโครโฟนไม่ได้ กรุณาลองอีกครั้ง');}
 }
 const button=(label:string,active:boolean,click:()=>void)=><button type="button" key={label} aria-pressed={active} onClick={click} className={`px-3 py-2 rounded-xl border text-sm ${active?'bg-amber-100 border-amber-500':'bg-white border-stone-200'}`}>{label}</button>;
 return <section aria-label="ผู้ช่วยค้นหาชุด" className="border border-stone-200 rounded-2xl bg-stone-50 p-4 mb-4 space-y-3">
  <div className="flex flex-wrap gap-2 items-center"><h3 className="font-semibold">ผู้ช่วยค้นหาชุด</h3><button type="button" onClick={listen} disabled={!supported} className="px-3 py-2 rounded-xl bg-amber-100 disabled:opacity-50">{listening?'หยุดฟัง':'🎤 พูดค้นหา'}</button><button type="button" className="text-sm underline" onClick={()=>{recognition.current?.abort();onChange({...emptyDressCriteria});setSpoken('');setMessage('');}}>ล้างเงื่อนไข</button></div>
  <p className="text-xs text-stone-600">พูด เช่น “ชุดสีเขียว ไซส์เอ็ม พร้อมเช่า” หรือเลือกด้านล่างได้ทันที</p>
  {!supported&&<p className="text-xs text-stone-600">เบราว์เซอร์นี้ยังไม่รองรับค้นหาด้วยเสียง ใช้ปุ่มเลือกได้</p>}
  <div aria-live="polite" className="text-sm">{spoken&&<p>ได้ยิน: {spoken}</p>}{message&&<p>{message}</p>}</div>
  <div className="flex gap-2 flex-wrap items-center"><span className="text-sm">ไซส์</span>{['XS','S','M','L','XL','XXL'].map(s=>button(s,value.size===s,()=>update('size',value.size===s?'':s)))}</div>
  <div className="flex gap-2 flex-wrap items-center"><span className="text-sm">สี</span>{['เขียว','ฟ้า','น้ำเงิน','ชมพู','ม่วง','แดง','ทอง','ครีม','ขาว','ดำ','น้ำตาล','ส้ม','เหลือง','เทา','นู้ด'].map(c=>button(c,value.color===c,()=>update('color',value.color===c?'':c)))}</div>
  <div className="flex gap-2 flex-wrap">{[['pastel','พาสเทล'],['warm','โทนอุ่น'],['cool','โทนเย็น'],['neutral','โทนกลาง']].map(([id,label])=>button(label,value.tone===id,()=>update('tone',value.tone===id?'':id)))}{[['short','ชุดสั้น'],['long','ชุดยาว']].map(([id,label])=>button(label,value.length===id,()=>update('length',value.length===id?'':id)))}{button('พร้อมเช่า',value.available,()=>update('available',!value.available))}</div>
  <div className="flex gap-3 flex-wrap">{[['chest','รอบอก'],['waist','รอบเอว'],['hip','รอบสะโพก']].map(([key,label])=><label key={key} className="text-xs">{label} (นิ้ว)<input type="number" min="0" max="100" step="0.5" value={value[key as 'chest']||''} onChange={e=>update(key as keyof DressCriteria,Number(e.target.value))} className="block border rounded-lg p-2 w-24 bg-white"/></label>)}</div>
  <p className="text-xs text-stone-600">ขนาดกรองจากสัดส่วนชุดที่บันทึกไว้ ควรลองชุดก่อนเช่า · พาสเทลแสดงเฉพาะรายการที่ระบุสีอ่อนหรือพาสเทล · พร้อมเช่าตามสต็อกปัจจุบัน ยังไม่ตรวจวันจอง</p>
 </section>;
}
