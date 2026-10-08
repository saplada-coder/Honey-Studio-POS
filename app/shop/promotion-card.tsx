'use client';
import {useEffect,useState} from 'react';
import {thaiToday} from '@/lib/booking-availability';
import {promotionStatus} from '@/lib/promotion-period';
import type {ShopInfo} from '@/lib/shop';
export default function PromotionCard({info}:{info:ShopInfo}){
  const [today,setToday]=useState(thaiToday);
  useEffect(()=>{const timer=setInterval(()=>setToday(thaiToday()),60000);return()=>clearInterval(timer);},[]);
  const status=promotionStatus(info.promotionStart,info.promotionEnd,today);
  return <section className="shop-panel bg-gradient-to-br from-[#fff5f6] to-[#fce8ec] border-[#e6b3be]"><div className="flex items-center justify-between gap-3 mb-4"><h2 className="font-semibold text-[#9b2450] text-lg">โปรโมชั่น HONEY STUDIO</h2>{info.promotions&&status!=='announced'&&<span className="rounded-full bg-white px-3 py-1 text-xs text-[#9b2450]">{status==='upcoming'?'เร็ว ๆ นี้':status==='active'?'อยู่ในช่วงโปรโมชั่น':'สิ้นสุดโปรโมชั่นแล้ว'}</span>}</div><p className="whitespace-pre-line text-lg font-semibold leading-8 text-[#9b2450]">{info.promotions||'ขณะนี้ยังไม่มีโปรโมชั่นประกาศ สอบถามร้านทาง LINE ได้ค่ะ'}</p>{info.promotionTerms&&<details className="mt-5" open><summary className="font-semibold cursor-pointer text-sm">เงื่อนไขการใช้สิทธิ์</summary><p className="whitespace-pre-line text-sm leading-7 mt-4">{info.promotionTerms}</p></details>}</section>;
}
