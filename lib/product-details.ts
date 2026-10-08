export type RentTier = { days: number; price: number };
export type PricedProduct = { rent: number; rentPrices?: string };
export function validateRentPrices(value: unknown): string {
  if (value === '' || value == null) return '';
  const rows=typeof value==='string'?JSON.parse(value):value;
  if(!Array.isArray(rows)||rows.length>30||rows.some(r=>!Number.isInteger(r.days)||r.days<2||r.days>365||!Number.isSafeInteger(r.price)||r.price<0||r.price>2147483647)||new Set(rows.map(r=>r.days)).size!==rows.length)throw new Error('จำนวนวันต้องเป็น 2–365 ไม่ซ้ำกัน และราคาเป็นจำนวนเต็มตั้งแต่ 0 บาท');
  return JSON.stringify(rows.map(r=>({days:r.days,price:r.price})).sort((a,b)=>a.days-b.days));
}
export function parseRentPrices(value: unknown): RentTier[] {
  try {
    const rows = typeof value === 'string' ? JSON.parse(value || '[]') : value;
    if (!Array.isArray(rows)) return [];
    return rows.filter(r => Number.isInteger(r.days) && r.days > 1 && Number.isInteger(r.price) && r.price >= 0)
      .map(r => ({ days: r.days, price: r.price })).sort((a,b) => a.days-b.days);
  } catch { return []; }
}
export function rentalPrice(product: PricedProduct, days: number): number {
  const tiers = [{ days: 1, price: product.rent || 0 }, ...parseRentPrices(product.rentPrices)];
  const tier = tiers.filter(t => t.days <= days).at(-1) || tiers[0];
  return tier.price + Math.max(0, days-tier.days)*50;
}
export function productMeasurements(product: {chest?:number;waist?:number;hip?:number;length?:number;note?:string}): [string,string][] {
  return ([['อก','chest'],['เอว','waist'],['สะโพก','hip'],['ความยาว','length']] as const).map(([label,key]) => {
    const value=product[key];
    if (value) return [label,`${value} นิ้ว`];
    const pattern=new RegExp(`(?:^|[;\\n])\\s*${key==='length'?'ยาว':label}\\s+([0-9]+(?:\\.[0-9]+)?(?:\\s*[–-]\\s*[0-9]+(?:\\.[0-9]+)?)?)\\s*นิ้ว`,'g');
    const matches=[...(product.note||'').matchAll(pattern)];
    return [label,matches.length?`${matches.at(-1)![1]} นิ้ว`:'ไม่ระบุ'];
  });
}
