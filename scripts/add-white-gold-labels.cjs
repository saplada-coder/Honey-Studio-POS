const fs = require('node:fs');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local', quiet: true });

const products = [
  { id: 'HS-GOLD-009', name: 'สีทอง 09', color: 'ทอง', chest: 34, waist: 29, hip: 49, length: 50, source: 'สีทอง 09; อก 17 เอว 14.5 สะโพก 24.5; ยาว 50 นิ้ว 127 ซม.' },
  { id: 'HS-GREEN-NOCODE-004', name: 'สีเขียว เดรสสายเดี่ยวดอกไม้กุหลาบ (ป้ายเขียนเลข 4)', color: 'เขียว', chest: 28, waist: 25, hip: 30, length: 58, source: 'ป้ายเขียนเลข 4 ไม่มีรหัสสีพิมพ์บนป้าย; อก 14 เอว 12.5 สะโพก 15; ยาว 58 นิ้ว 147.32 ซม.' },
  { id: 'HS-WHITE-004', name: 'สีขาว 04', color: 'ขาว', chest: 32, waist: 25, hip: 33, length: 0, source: 'สีขาว 04; อก 16 เอว 12.5 สะโพก 16.5; ยาว 56.5 นิ้ว 143.51 ซม.' },
];

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['white-gold-label-batch']);
    const existing = await client.query('SELECT * FROM "Product" WHERE id = ANY($1::text[])', [products.map(p => p.id)]);
    fs.mkdirSync('recovery', { recursive: true });
    fs.writeFileSync('recovery/white-gold-before.json', JSON.stringify(existing.rows, null, 2));
    if (existing.rows.length) throw new Error('Product IDs already exist; no changes made.');
    const added = [];
    for (const p of products) {
      const note = `ข้อมูลจากป้าย: ${p.source}\nค่าอก เอว สะโพกบนป้ายเป็นแนวราบ คูณสองเพื่อแสดงรอบตัว ความยาวไม่คูณ\nค่าเช่าวันแรก 250 บาท\nรอรูปเต็มชุด`;
      const result = await client.query('INSERT INTO "Product" (id,name,cat,type,rent,"stockRent","stockSell",status,color,chest,waist,hip,length,note,"updatedAt") VALUES ($1,$2,$3,$4,250,1,0,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING id,name,rent,chest,waist,hip,length', [p.id,p.name,'ชุดราตรี','เช่า','พร้อมเช่า',p.color,p.chest,p.waist,p.hip,p.length,note]);
      added.push(result.rows[0]);
    }
    await client.query('COMMIT');
    fs.writeFileSync('recovery/white-gold-added.json', JSON.stringify(added, null, 2));
    console.log(JSON.stringify(added));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { await client.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
