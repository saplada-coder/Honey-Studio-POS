import type {ShopInfo} from '@/lib/shop';
export function PolicySection({title,text}:{title:string;text:string}){
  if(!text)return null;
  return <section className="shop-panel"><h2 className="font-semibold text-lg text-[#9b2450] mb-4">{title}</h2><p className="whitespace-pre-line text-sm leading-8">{text}</p></section>;
}
export function PriceAndBooking({info}:{info:ShopInfo}){
  return <><section className="shop-panel"><h2 className="font-semibold text-[#9b2450] mb-4">ค่าเช่าเริ่มต้นและเงินประกันชุด</h2><div className="overflow-x-auto"><table className="w-full text-sm text-center"><thead className="bg-[#fce8ec]"><tr><th className="p-3">ค่าเช่าเริ่มต้น</th><th className="p-3">เงินประกันชุด</th><th className="p-3">ยอดรวมเริ่มต้น</th></tr></thead><tbody>{[150,250,350].map(price=><tr key={price} className="border-b border-stone-200"><td className="p-3">{price} บาท</td><td className="p-3">{price} บาท</td><td className="p-3 font-semibold">{price*2} บาท</td></tr>)}</tbody></table></div><p className="text-xs text-stone-500 leading-6 mt-4">ราคาที่แสดงเป็นราคาเริ่มต้น ค่าเช่าแต่ละชุดแตกต่างกัน ร้านยืนยันราคาตามชุดและระยะเวลาเช่าก่อนจอง ยอดรวมยังไม่รวมค่าจัดส่ง</p></section><PolicySection title="จองอย่างไร?" text={info.bookingGuide}/><PolicySection title="การนับวันเช่า" text={info.rentalCounting}/></>;
}
export function RentalPolicies({info}:{info:ShopInfo}){
  return <><PolicySection title="รับชุด / ส่งคืน" text={info.collectionTerms}/><PolicySection title="รับ–คืนชุดและการดูแล" text={info.rentalRules}/><PolicySection title="ค่าเสียหาย / อุปกรณ์สูญหาย" text={info.damageTerms}/><PolicySection title="เลื่อน / เปลี่ยน / ยกเลิก" text={info.changeTerms}/><PolicySection title="ซื้อชุด" text={info.purchaseTerms}/><PolicySection title="ไม่คืนชุด / มียอดค้าง" text={info.outstandingTerms}/></>;
}
