const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: '.env.local', quiet: true });
const { Client } = require('pg');
const input = JSON.parse(fs.readFileSync(path.join(__dirname, 'red-stock-data.json'), 'utf8'));
const client = new Client({ connectionString: process.env.DATABASE_URL });
const normalize = s => s.trim().replace(/\s+/g, ' ');
const apply = process.argv.includes('--apply');
async function main() {
  await client.connect();
  await client.query('BEGIN');
  await client.query('LOCK TABLE "Product" IN SHARE ROW EXCLUSIVE MODE');
  const existing = (await client.query('SELECT id,name FROM "Product"')).rows;
  const names = new Set(existing.map(p => normalize(p.name)));
  const ids = new Set(existing.map(p => p.id));
  const inserted = [], skipped = [], review = [];
  for (const [name, chestFlat, waistFlat, hipSource, length] of input.rows) {
    if (names.has(normalize(name))) { skipped.push(name); continue; }
    const number = name.match(/^แดง (\d+)/)[1].padStart(3, '0');
    let id = `HS-RED-${number}`;
    let suffix = 2;
    while (ids.has(id)) id = `HS-RED-${number}-${suffix++}`;
    const chest = chestFlat * input.chestMultiplier;
    const waist = waistFlat * input.waistMultiplier;
    const hip = typeof hipSource === 'number' ? Number((hipSource * input.hipMultiplier).toFixed(4)) : null;
    const cm = Number((length * 2.54).toFixed(2));
    const notes = [
      `วัดขนาดเซ็ตสีแดง: อก ${chest} นิ้ว; เอว ${waist} นิ้ว; สะโพก ${hip === null ? 'รอตรวจสอบ' : `${hip} นิ้ว`}; ยาว ${length} นิ้ว (${cm} ซม.)`,
      `ค่าที่วัดก่อนคูณ 2: อก ${chestFlat}; เอว ${waistFlat}; สะโพก ${hipSource}`,
      'อก เอว สะโพกคูณ 2 ตามคำสั่ง; ความยาวไม่คูณ',
    ];
    if (name.includes('ซ้ำ')) notes.push(name.slice(name.indexOf('ซ้ำ')));
    if (name.includes('ตำหนิ')) notes.push('มีตำหนิ');
    if (hip === null) { notes.push('รอตรวจสอบสะโพก: ต้นฉบับระบุ 139.7 ซม. ไม่คูณค่าที่อาจพิมพ์ผิด'); review.push({ name, issue: 'สะโพกต้นฉบับ 139.7 ซม.' }); }
    if ((hip !== null && !Number.isInteger(hip)) || !Number.isInteger(length)) {
      notes.push('ขนาดทศนิยมเก็บในหมายเหตุ เนื่องจากช่องขนาดของระบบรองรับจำนวนเต็ม; ช่องที่ใส่ไม่ได้เว้นเป็น 0 (ไม่ระบุ) โดยไม่ปัดเศษ');
      review.push({ name, hip, length, issue: 'ค่าทศนิยมในหมายเหตุ' });
    }
    const storedHip = Number.isInteger(hip) ? hip : 0;
    const storedLength = Number.isInteger(length) ? length : 0;
    await client.query(
      `INSERT INTO "Product" (id,name,cat,type,"stockRent","stockSell",color,chest,waist,hip,length,note,"updatedAt") VALUES ($1,$2,$3,$4,1,0,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP)`,
      [id, name, 'ชุดราตรี', 'เช่า', 'แดง', chest, waist, storedHip, storedLength, notes.join('\n')]
    );
    inserted.push({ id, name });
    names.add(normalize(name)); ids.add(id);
  }
  if (inserted.length) {
    const stored = (await client.query('SELECT id,name,chest,waist,hip,length,note,"stockRent" FROM "Product" WHERE id = ANY($1::text[])', [inserted.map(p => p.id)])).rows;
    if (stored.length !== inserted.length || stored.some(p => p.stockRent !== 1 || !p.note.includes('ความยาวไม่คูณ'))) throw new Error('Verification failed; rolling back');
  }
  await client.query(apply ? 'COMMIT' : 'ROLLBACK');
  const result = { applied: apply, insertedCount: inserted.length, skipped, inserted, review };
  if (apply) fs.writeFileSync(path.join(__dirname, 'red-stock-import-result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}
main().catch(async error => {
  await client.query('ROLLBACK').catch(() => {});
  console.error(error.message || error.code || 'Database connection failed');
  process.exitCode = 1;
}).finally(() => client.end());
