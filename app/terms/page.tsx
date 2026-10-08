import {shopInfo} from '@/lib/shop';
import PromotionCard from '../shop/promotion-card';
import {PolicySection,PriceAndBooking,RentalPolicies} from '../member/shop-policy';
export const dynamic='force-dynamic';
export default async function ShopTerms(){
  const info=await shopInfo();
  return <main className="min-h-screen bg-[#fcfaf6] px-5 py-8"><div className="max-w-3xl mx-auto space-y-6"><header className="text-center"><img src="/logo.png" alt="HONEY STUDIO" width={100} height={100} className="mx-auto"/><h1 className="font-serif text-2xl tracking-widest mt-4">HONEY STUDIO</h1><p className="text-sm text-stone-500 mt-2">ราคา โปรโมชั่น และเงื่อนไขการใช้บริการ</p></header><PromotionCard info={info}/><PriceAndBooking info={info}/><PolicySection title="เงินประกันและการคืนเงิน" text={info.depositTerms}/><RentalPolicies info={info}/><footer className="text-center space-y-4"><p className="text-sm">สาวอวบสวยครบทุกลุค เช่าจบในร้านเดียว 💗</p><a href="/join" className="shop-button">เข้าสู่หน้าสมาชิก</a><a href="https://lin.ee/OfHxMgW" target="_blank" rel="noopener noreferrer" className="block underline text-sm">สอบถามและยืนยันเงื่อนไขทาง LINE</a></footer></div></main>;
}
