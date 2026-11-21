'use client';
import {useEffect,useRef,useState} from 'react';
import {emptyDressCriteria,parseDressRequest,type DressCriteria} from '@/lib/dress-finder';
import {ChevronDown, Mic, SlidersHorizontal, X} from 'lucide-react';
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
 const tones=[['pastel','พาสเทล'],['warm','โทนอุ่น'],['cool','โทนเย็น'],['neutral','โทนกลาง']];
 const selected: {key:keyof DressCriteria;label:string;clear:string|number|boolean}[]=[];
 if(value.size)selected.push({key:'size',label:`ไซส์ ${value.size}`,clear:''});
 if(value.color)selected.push({key:'color',label:`สี${value.color}`,clear:''});
 if(value.tone)selected.push({key:'tone',label:tones.find(([id])=>id===value.tone)?.[1]||value.tone,clear:''});
 if(value.length)selected.push({key:'length',label:value.length==='short'?'ชุดสั้น':'ชุดยาว',clear:''});
 if(value.available)selected.push({key:'available',label:'พร้อมเช่า',clear:false});
 for(const [key,label] of [['chest','อก'],['waist','เอว'],['hip','สะโพก']] as const)if(value[key])selected.push({key,label:`${label} ${value[key]} นิ้ว`,clear:0});
 const advancedCount=selected.filter(({key})=>!['size','color','available'].includes(key)).length;
 const selectClass='mt-1 block w-full appearance-none rounded-xl border border-stone-200 bg-white py-2.5 pl-3 pr-9 text-base focus:border-amber-500 focus:outline-none';
 const selectArrow=<ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"/>;
 return <section aria-label="ผู้ช่วยค้นหาชุด" className="border border-stone-200 rounded-2xl bg-white p-4 mb-4 space-y-4">
  <div className="flex flex-wrap gap-3 items-center justify-between">
   <h3 className="font-semibold">ผู้ช่วยค้นหาชุด</h3>
   <button type="button" onClick={listen} disabled={!supported} title={!supported?'เบราว์เซอร์นี้ยังไม่รองรับค้นหาด้วยเสียง':undefined} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-100 text-sm disabled:opacity-50"><Mic size={16}/>{listening?'หยุดฟัง':'พูดค้นหา'}</button>
  </div>
  <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
   <label className="text-sm text-stone-600">ไซส์<div className="relative"><select value={value.size} onChange={e=>update('size',e.target.value)} className={selectClass}><option value="">ทุกไซส์</option>{['XS','S','M','L','XL','XXL'].map(size=><option key={size}>{size}</option>)}</select>{selectArrow}</div></label>
   <label className="text-sm text-stone-600">สี<div className="relative"><select value={value.color} onChange={e=>update('color',e.target.value)} className={selectClass}><option value="">ทุกสี</option>{['เขียว','ฟ้า','น้ำเงิน','ชมพู','ม่วง','แดง','ทอง','ครีม','ขาว','ดำ','น้ำตาล','ส้ม','เหลือง','เทา','นู้ด'].map(color=><option key={color}>{color}</option>)}</select>{selectArrow}</div></label>
   <label className="col-span-2 sm:col-span-1 flex items-center gap-2 min-h-11 text-sm cursor-pointer"><input type="checkbox" checked={value.available} onChange={e=>update('available',e.target.checked)} className="size-4 accent-amber-600"/>พร้อมเช่าเท่านั้น</label>
  </div>
  <details className="group border-t border-stone-100 pt-3">
   <summary className="flex items-center justify-between gap-2 cursor-pointer list-none text-sm text-stone-600 [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><SlidersHorizontal size={16}/>ตัวกรองเพิ่มเติม{advancedCount>0&&<span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">{advancedCount}</span>}</span><ChevronDown size={16} className="transition-transform group-open:rotate-180"/></summary>
   <div className="grid grid-cols-2 gap-3 mt-4">
    <label className="text-sm text-stone-600">โทนสี<div className="relative"><select value={value.tone} onChange={e=>update('tone',e.target.value)} className={selectClass}><option value="">ทุกโทนสี</option>{tones.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>{selectArrow}</div></label>
    <label className="text-sm text-stone-600">ความยาวชุด<div className="relative"><select value={value.length} onChange={e=>update('length',e.target.value)} className={selectClass}><option value="">ทุกความยาว</option><option value="short">ชุดสั้น</option><option value="long">ชุดยาว</option></select>{selectArrow}</div></label>
   </div>
   <fieldset className="mt-4"><legend className="text-sm font-medium text-stone-600">สัดส่วน (นิ้ว)</legend><div className="grid grid-cols-3 gap-3 mt-2">{([['chest','รอบอก'],['waist','รอบเอว'],['hip','รอบสะโพก']] as const).map(([key,label])=><label key={key} className="text-sm text-stone-600">{label}<input type="number" min="0" max="100" step="0.5" value={value[key]||''} onChange={e=>update(key,Number(e.target.value))} placeholder="ไม่ระบุ" className="mt-1 block border border-stone-200 rounded-xl p-2.5 w-full min-w-0 bg-white text-base focus:border-amber-500 focus:outline-none"/></label>)}</div></fieldset>
   <p className="text-sm text-stone-500 mt-3">สัดส่วนอ้างอิงจากข้อมูลชุด ควรลองก่อนเช่า · พาสเทลเลือกจากสีอ่อนที่บันทึกไว้ · พร้อมเช่าตามสต็อก ยังไม่ตรวจวันจอง</p>
  </details>
  {selected.length>0&&<div className="flex flex-wrap gap-2 items-center border-t border-stone-100 pt-3" aria-label="เงื่อนไขที่เลือก">{selected.map(({key,label,clear})=><button key={key} type="button" aria-label={`ล้างเงื่อนไข ${label}`} onClick={()=>update(key,clear)} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-900 px-3 py-1.5 text-sm">{label}<X size={14}/></button>)}<button type="button" className="text-sm text-stone-500 underline px-1 py-2" onClick={()=>{recognition.current?.abort();setListening(false);onChange({...emptyDressCriteria});setSpoken('');setMessage('');}}>ล้างทั้งหมด</button></div>}
  {(spoken||message)&&<div aria-live="polite" className="text-sm text-stone-600 rounded-xl bg-stone-50 p-3">{spoken&&<p>ได้ยิน: {spoken}</p>}{message&&<p>{message}</p>}</div>}
 </section>;
}
