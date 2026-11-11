"use client";

import {useState} from 'react';
import {thaiToday} from '@/lib/booking-availability';
import {rentalsForDay} from '@/lib/rental-calendar';

type Rental={id:string;cust:string;item:string;code:string;start:string;end:string;status:string;phone?:string};
const monthNames=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
export default function RentalCalendar({rentals,onEdit}:{rentals:Rental[];onEdit?:(r:Rental)=>void}){
  const today=thaiToday();
  const [month,setMonth]=useState(today.slice(0,7));
  const [selected,setSelected]=useState(today);
  const [year,monthNumber]=month.split('-').map(Number);
  const first=new Date(Date.UTC(year,monthNumber-1,1)).getUTCDay();
  const days=new Date(Date.UTC(year,monthNumber,0)).getUTCDate();
  const rows=rentalsForDay(rentals,selected,today);
  const move=(delta:number)=>{
    const date=new Date(Date.UTC(year,monthNumber-1+delta,1)).toISOString().slice(0,10);
    setMonth(date.slice(0,7));setSelected(date);
  };
  const dateLabel=new Intl.DateTimeFormat('th-TH',{dateStyle:'long',timeZone:'UTC'}).format(new Date(selected+'T00:00:00Z'));
  return <div className="bg-white border rounded-2xl p-4" style={{borderColor:'#EAE2D4'}}>
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <h3 className="font-semibold">ปฏิทินคิวเช่า</h3>
      <button type="button" className="text-xs underline" onClick={()=>{setMonth(today.slice(0,7));setSelected(today);}}>วันนี้</button>
    </div>
    <div className="flex items-center justify-between mb-4">
      <button type="button" aria-label="เดือนก่อนหน้า" onClick={()=>move(-1)} className="border rounded-lg px-3 py-2">‹</button>
      <div className="font-medium">{monthNames[monthNumber-1]} {year+543}</div>
      <button type="button" aria-label="เดือนถัดไป" onClick={()=>move(1)} className="border rounded-lg px-3 py-2">›</button>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center">
      {['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'].map(d=><div key={d} className="text-xs text-stone-400 py-2">{d}</div>)}
      {Array.from({length:first},(_,i)=><div key={'empty'+i}/>)}
      {Array.from({length:days},(_,i)=>{
        const day=month+'-'+String(i+1).padStart(2,'0');
        const bookings=rentalsForDay(rentals,day,today);
        const picked=day===selected;
        return <button type="button" key={day} aria-pressed={picked} aria-label={`${i+1} ${monthNames[monthNumber-1]} ${year+543} ${bookings.length} รายการ`} onClick={()=>setSelected(day)} className="rounded-xl min-h-16 py-2 flex flex-col items-center gap-1 border" style={{background:picked?'#B99A45':day===today?'#F7F1E1':'#fff',color:picked?'white':'#403B35',borderColor:picked?'#B99A45':'#F2EDE5'}}>
          <span className="text-sm font-medium">{i+1}</span>
          {bookings.length>0&&<span className="text-[10px]">{bookings.length} คิว</span>}
        </button>;
      })}
    </div>
    <div className="mt-5 border-t pt-4" style={{borderColor:'#EAE2D4'}}>
      <div className="font-semibold text-sm">{dateLabel}</div>
      <p className="text-xs text-stone-400 mt-1 mb-3">รวมคิวรับชุด คืนชุด และรายการระหว่างเช่า</p>
      {!rows.length?<p className="text-sm text-stone-400 py-4 text-center">ไม่มีคิวเช่าในวันนี้</p>:<div className="space-y-2">{rows.map(r=><div key={r.id} className="rounded-xl p-3 bg-stone-50">
        <div className="flex justify-between items-start gap-2"><div className="font-medium text-sm">{r.cust}</div><span className="text-xs shrink-0 rounded-md px-2 py-1" style={{background:r.event==='รับชุด'?'#F5EBD2':r.event==='คืนชุด'?'#E7EEF7':'#ECEAE6'}}>{r.event}</span></div>
        <div className="text-sm mt-1">{r.item}</div>
        <div className="text-xs text-stone-500 mt-1">{r.code||r.id} · {r.status}</div>
        <div className="text-xs text-stone-500 mt-1">รับ {r.start} · คืน {r.end}</div>
        {r.phone&&<a href={`tel:${r.phone}`} className="inline-block text-xs underline mt-2">{r.phone}</a>}
        {onEdit&&<button type="button" className="text-xs underline mt-2 ml-3" onClick={()=>onEdit(r)}>ดู / แก้ไขรายการ</button>}
      </div>)}</div>}
    </div>
  </div>;
}
