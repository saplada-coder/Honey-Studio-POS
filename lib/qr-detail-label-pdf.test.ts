import {test} from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import {labelDetails,qrDetailLabelsPdf} from './qr-detail-label-pdf';

const product={id:'HS-RED-013',name:'แดง 013 ซ้ำ / 002 แดง 011',size:'XS',chest:31,waist:29,hip:34,length:55};
const modules=QRCode.create('https://honey-studio-opal.vercel.app/p/HS-RED-013',{errorCorrectionLevel:'M'}).modules;
test('label details match the approved Thai sample and use recorded size',()=>{
  assert.deepEqual(labelDetails(product),{name:'แดง 013',subtitle:'ซ้ำ / 002 แดง 011',size:'XS',dimensions:'อก 31 · เอว 29 · สะโพก 34',lengthText:'ยาว 55 นิ้ว / 139.7 ซม.'});
});
test('decimal lengths and stretch ranges are retained from notes',()=>{
  const details=labelDetails({...product,chest:0,length:0,note:'อก 30–36 นิ้ว; ยาว 47.5 นิ้ว'});
  assert.match(details.dimensions,/30–36/);assert.equal(details.lengthText,'ยาว 47.5 นิ้ว / 120.65 ซม.');
});
test('missing dimensions are identified without invented numbers',()=>{
  const details=labelDetails({id:'unknown',name:'ชุดทดสอบ',size:'รอวัดไซส์'});
  assert.equal(details.subtitle,'');assert.equal(details.size,'รอวัดไซส์');assert.match(details.dimensions,/ไม่ระบุ/);
});
test('PDF contains one correctly sized page per label, embedded Thai fonts and vector QR',async()=>{
  const pdf=Buffer.from(await qrDetailLabelsPdf([{product,modules},{product:{...product,id:'HS-8839'},modules}]));
  const text=pdf.toString('latin1');
  assert.ok(text.startsWith('%PDF-'));assert.equal((text.match(/\/Type \/Page\b/g)||[]).length,2);
  assert.match(text,/\/FontFile2/);assert.match(text,/\/ToUnicode/);
  assert.match(text,/\/MediaBox \[0 0 141\.73228\d* 198\.42519\d*\]/);
  assert.doesNotMatch(text,/\/Subtype \/Image/);
});
test('empty and excessive exports are rejected',async()=>{
  await assert.rejects(qrDetailLabelsPdf([]));await assert.rejects(qrDetailLabelsPdf(Array(501).fill({product,modules})));
});
test('custom single-label paper sizes keep one page and reject invalid dimensions',async()=>{
  const pdf=Buffer.from(await qrDetailLabelsPdf([{product,modules}],60,80)).toString('latin1');
  assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,1);
  await assert.rejects(qrDetailLabelsPdf([{product,modules}],NaN,70));
});
