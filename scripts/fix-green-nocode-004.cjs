const fs = require('node:fs');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local', quiet: true });
(async () => {
 const c = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
 try {
  await c.connect(); await c.query('BEGIN');
  const before = await c.query('SELECT * FROM "Product" WHERE id = ANY($1::text[]) FOR UPDATE', [['HS-WHITE-NOCODE-004','HS-GREEN-NOCODE-004']]);
  if (before.rows.length !== 1 || before.rows[0].id !== 'HS-WHITE-NOCODE-004') throw new Error('Unexpected stock state; no changes made');
  fs.mkdirSync('recovery', { recursive: true });
  fs.writeFileSync('recovery/green-nocode-004-before.json', JSON.stringify(before.rows, null, 2));
  const result = await c.query('UPDATE "Product" SET id=$1,name=$2,color=$3,"updatedAt"=NOW() WHERE id=$4 RETURNING id,name,color,rent', ['HS-GREEN-NOCODE-004','สีเขียว เดรสสายเดี่ยวดอกไม้กุหลาบ (ป้ายเขียนเลข 4)','เขียว','HS-WHITE-NOCODE-004']);
  await c.query('COMMIT'); console.log(JSON.stringify(result.rows));
 } catch(e) { await c.query('ROLLBACK').catch(()=>{}); throw e; }
 finally { await c.end(); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
