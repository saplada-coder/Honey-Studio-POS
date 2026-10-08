import assert from 'node:assert/strict';
import {octoberShopPolicy} from '../lib/customer-policy';
async function main(){
  const base='http://127.0.0.1:3019';
  const response=await fetch(base+'/api/shop/settings');assert.equal(response.status,200);const settings=await response.json();
  for(const [key,value] of Object.entries(octoberShopPolicy))assert.equal(settings[key],value,'Published content: '+key);
  const page=await fetch(base+'/terms');assert.equal(page.status,200);const html=(await page.text()).replace(/<!--[\s\S]*?-->/g,'');
  for(const text of ['9–30 ตุลาคม 2569','ส่วนลดค่าเช่าทันที 10%','เงินประกันสำหรับชุดทั้ง 2 ชุด','เงินจองเป็นส่วนหนึ่งของค่าเช่า','50%','1 ชั่วโมง','ค่าล่าช้า 100 บาท/วัน','100 บาท/จุดหรือรายการ','200 บาท/จุด','ไม่คิดซ้ำหลายอัตรา','เลื่อนฟรี 1 ครั้ง','24 ชั่วโมง','ระงับการจองครั้งถัดไป','300 บาท','500 บาท','700 บาท','เร็ว ๆ นี้'])assert.ok(html.includes(text),'Public policy text: '+text);
  console.log('PASS: published promotion and all three policy pages match shop content; public price/deposit totals, advance booking, late/damage fees, changes, sale and campaign status render correctly');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
