"use client";
import {thaiToday} from '@/lib/booking-availability';
export default function AvailabilityCalendar({days,onSelect}:{days:{date:string;remaining:number}[];onSelect:(date:string)=>void}){
  const offset=days.length?new Date(days[0].date+'T00:00:00Z').getUTCDay():0;
  return <div className="grid grid-cols-7 gap-2">
    {['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'].map(day=><div key={day} className="text-xs text-center text-stone-500 pb-2">{day}</div>)}
    {Array.from({length:offset},(_,i)=><div key={'blank-'+i} aria-hidden="true"/>)}
    {days.map(day=><button key={day.date} aria-label={`${day.date} ${day.remaining?'ว่าง '+day.remaining:'เต็ม'}`} disabled={day.date<thaiToday()} onClick={()=>onSelect(day.date)} className={'rounded-lg py-2 text-xs disabled:opacity-30 '+(day.remaining?'bg-green-50 text-green-800':'bg-rose-50 text-rose-800')}><strong className="block">{Number(day.date.slice(-2))}</strong>{day.remaining?'ว่าง '+day.remaining:'เต็ม'}</button>)}
  </div>;
}
