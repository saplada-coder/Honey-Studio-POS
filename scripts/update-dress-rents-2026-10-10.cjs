const fs = require('node:fs');
const {Client} = require('pg');
require('dotenv').config({path:'.env.local',quiet:true});
const ids=['HS-PINK-100','HS-SKY-003','HS-GREEN-001','HS-SKY-022','HS-SKY-002','HS-ORANGE-001','HS-PINK-065'];
async function main(){
 const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
 try {
  await c.connect(); await c.query('BEGIN');
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['dress-import-2026-10-10']);
  const before=await c.query('SELECT * FROM "Product" WHERE id=ANY($1::text[]) FOR UPDATE',[ids.concat('HS-GOLD-007')]);
  if(ids.some(id=>!before.rows.some(row=>row.id===id)))throw Error('Missing expected product');
  fs.mkdirSync('recovery',{recursive:true});
  fs.writeFileSync('recovery/dress-rents-before-'+Date.now()+'.json',JSON.stringify(before.rows,null,2));
  await c.query('UPDATE "Product" SET rent=150,"updatedAt"=NOW() WHERE id=ANY($1::text[])',[ids]);
  const gold=before.rows.find(row=>row.id==='HS-GOLD-007');
  if(gold && !gold.name.includes('07'))throw Error('Gold ID collision');
  if(!gold)await c.query('INSERT INTO "Product" (id,name,cat,type,rent,"stockRent","stockSell",status,color,chest,waist,hip,length,note,"updatedAt") VALUES ($1,$2,$3,$4,150,1,0,$5,$6,34,47,54,33,$7,NOW())',[
   'HS-GOLD-007','สีทอง 07 เดรสสายโซ่ไขว้','ชุดราตรี','เช่า','พร้อมเช่า','ทอง',
   'ข้อมูลจากป้าย 2026-10-10: อก 17; เอว 23.5; สะโพก 27 นิ้ว (วัดแนวราบ คูณ 2 เป็นรอบตัว)\nยาว 33 นิ้ว 83.82 ซม.\nค่าเช่าวันแรก 150 บาท จำนวน 1 ชุด'
  ]);
  else await c.query('UPDATE "Product" SET rent=150,"updatedAt"=NOW() WHERE id=$1',['HS-GOLD-007']);
  const after=await c.query('SELECT id,name,rent,"stockRent",chest,waist,hip,length FROM "Product" WHERE id=ANY($1::text[]) ORDER BY id',[ids.concat('HS-GOLD-007')]);
  if(after.rows.length!==8 || after.rows.some(row=>row.rent!==150))throw Error('Verification failed');
  await c.query('COMMIT'); console.log(JSON.stringify(after.rows,null,2));
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{await c.end();}
}
main().catch(e=>{console.error(e.code||e.message);process.exitCode=1;});
