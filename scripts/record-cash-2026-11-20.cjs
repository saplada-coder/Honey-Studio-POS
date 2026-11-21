require('dotenv').config({ path: '.env.local', quiet: true });
const { Client } = require('pg');
const rows = [
  ['opening', 'ยอดยกมา เงินสดที่ร้าน', 'in', 1050],
  ['refund-mod', 'คืนค่ามัดจำ คุณมด', 'out', 250],
  ['flowers', 'ค่าดอกไม้ไหว้พระ', 'out', 60],
  ['refund-hai', 'คืนค่ามัดจำ คุณฮาย', 'out', 250],
  ['refund-see', 'คืนค่ามัดจำ คุณซี', 'out', 250],
];
async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
  await db.connect();
  try {
    await db.query('BEGIN');
    await db.query('LOCK TABLE "CashEntry" IN SHARE ROW EXCLUSIVE MODE');
    let created = 0;
    for (const [suffix, desc, type, amt] of rows) {
      const id = `CASH-20261120-${suffix}`;
      const matches = (await db.query('SELECT * FROM "CashEntry" WHERE id=$1 OR (date=$2 AND "desc"=$3 AND type=$4 AND amt=$5)', [id, '2026-11-20', desc, type, amt])).rows;
      if (matches.length) {
        if (matches.length !== 1 || matches[0].date !== '2026-11-20' || matches[0].desc !== desc || matches[0].type !== type || matches[0].amt !== amt) throw new Error('Existing cash entry conflicts with requested record');
        continue;
      }
      await db.query('INSERT INTO "CashEntry" (id,date,"desc",type,amt,"createdAt") VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP + $6 * INTERVAL \'1 millisecond\')', [id, '2026-11-20', desc, type, amt, created]);
      created++;
    }
    const totals = (await db.query('SELECT COALESCE(SUM(CASE WHEN type=\'in\' THEN amt ELSE -amt END),0) AS balance FROM "CashEntry"')).rows[0];
    await db.query('COMMIT');
    console.log(JSON.stringify({ created, requested: rows.length, opening: 1050, outgoing: 810, batchBalance: 240, cashBookBalance: Number(totals.balance) }));
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally { await db.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
