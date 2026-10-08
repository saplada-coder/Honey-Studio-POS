'use client';
import {useEffect,useState} from 'react';
import {loyaltyTerms} from '@/lib/loyalty-rules';
export default function LoyaltyCard(){
  const [balance,setBalance]=useState<number|null>(null);
  useEffect(()=>{let active=true;async function load(){try{const r=await fetch('/api/shop/customer-account',{cache:'no-store'});if(r.ok){const d=await r.json();if(active)setBalance(d.balance);}}catch{}}void load();const timer=setInterval(()=>void load(),60000);window.addEventListener('loyalty-updated',load);return()=>{active=false;clearInterval(timer);window.removeEventListener('loyalty-updated',load);};},[]);
  return <section className="shop-panel bg-[#fff3f5]"><h2 className="font-semibold text-lg text-[#9b2450]">ข้อมูลการจอง + สะสมแต้ม</h2><p className="text-2xl font-bold text-[#9b2450] my-4">{balance===null?'…':balance} แต้ม</p>{balance!==null&&<><progress className="w-full accent-rose-500" max={10} value={balance%10}/><p className="text-sm mt-2">สิทธิ์เช่าฟรี {Math.floor(balance/10)} ครั้ง · {balance<10?'อีก '+(10-balance)+' แต้มครบสิทธิ์':'เลือกใช้สิทธิ์กับรายการค่าเช่าไม่เกิน 350 บาทก่อนชำระเงิน'}</p></>}<details open className="mt-4"><summary className="font-semibold text-sm cursor-pointer">สิทธิพิเศษและเงื่อนไขสมาชิก</summary><p className="whitespace-pre-line text-sm leading-7 mt-4">{loyaltyTerms}</p></details></section>;
}
