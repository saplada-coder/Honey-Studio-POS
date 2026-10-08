'use client';
import {useState} from 'react';
import {MessageCircle,X} from 'lucide-react';
export default function LineContact(){
  const [open,setOpen]=useState(true);
  return <aside aria-label="ติดต่อร้านทาง LINE" className="fixed bottom-5 right-4 z-40 print:hidden">{open&&<div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 mb-3 w-[min(280px,calc(100vw-32px))]"><div className="flex justify-between gap-3"><strong>HONEY STUDIO</strong><button aria-label="ปิดหน้าต่าง LINE" onClick={()=>setOpen(false)}><X size={18}/></button></div><p className="text-sm text-stone-600 my-3">สอบถามชุดเช่า คิวจอง หรือวันคืนชุด ทักหาเราได้เลยค่ะ</p><a href="https://lin.ee/OfHxMgW" target="_blank" rel="noopener noreferrer" className="block text-center bg-[#06c755] text-white rounded-xl py-3 font-semibold">ติดต่อเราทาง LINE</a></div>}<button onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="เปิดหรือปิดหน้าต่างติดต่อ LINE" className="ml-auto flex items-center gap-2 bg-[#06c755] text-white rounded-full px-4 py-3 shadow-lg"><MessageCircle size={22}/>LINE</button></aside>;
}
