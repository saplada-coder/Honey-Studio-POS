import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import {qrLabelPdf} from '../lib/qr-label-pdf';
const qr=QRCode.create('https://honey-studio-opal.vercel.app/p/HS-4282',{errorCorrectionLevel:'M'});
for(const id of ['HS-4282','HS-SKY-008','HS-(test)\\008']){
  const pdf=new TextDecoder().decode(qrLabelPdf(id,qr.modules));
  assert.ok(pdf.includes('/Count 1'));
  assert.ok(pdf.includes('/MediaBox [0 0 164.4094 249.4488]'));
  assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,1);
  const startxref=Number(pdf.match(/startxref\n(\d+)/)![1]);
  assert.equal(pdf.slice(startxref,startxref+4),'xref');
  const offsets=[...pdf.matchAll(/(\d{10}) 00000 n/g)].map(match=>Number(match[1]));
  offsets.forEach((offset,index)=>assert.ok(pdf.slice(offset).startsWith(`${index+1} 0 obj`)));
  const stream=pdf.match(/\/Length (\d+) >>\nstream\n([\s\S]*?)endstream/)!;
  assert.equal(Number(stream[1]),stream[2].length);
  assert.equal((pdf.match(/ re f/g)||[]).length,Array.from({length:qr.modules.size},(_,row)=>Array.from({length:qr.modules.size},(_,col)=>Number(qr.modules.get(row,col))).reduce((a,b)=>a+b,0)).reduce((a,b)=>a+b,0));
  assert.ok(!pdf.includes('/staff'));
}
console.log('PASS: one-page 58x88mm PDF, QR modules, escaped dress codes, byte offsets and stream lengths');
