const fs=require('node:fs');
const {Client}=require('pg');
require('dotenv').config({path:'.env.local',quiet:true});
async function main(){
 const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
 const id='HS-GREEN-001',name='เดรสแขนกุดสีเขียว แต่งผ้าพลิ้ว';
 try{
  await c.connect();await c.query('BEGIN');
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[id]);
  const existing=await c.query('SELECT * FROM "Product" WHERE id=$1',[id]);
  if(existing.rows.length){
   if(existing.rows[0].name!==name)throw Error('Product ID already used by another item');
   console.log(JSON.stringify({id,alreadyExists:true}));await c.query('COMMIT');return;
  }
  const note='[ข้อมูลจากป้าย 2026-10-10]\nอก 36 นิ้ว; เอว 31 นิ้ว; สะโพก 33 นิ้ว; ยาว 38 นิ้ว (96.52 ซม.)\nค่าที่วัดแนวราบ: อก 18; เอว 15.5; สะโพก 16.5 นิ้ว\nอก เอว สะโพกคูณ 2; ความยาวไม่คูณ\nไซส์ XL ตามป้ายแบรนด์ในภาพ\nผู้ใช้ยืนยันค่าเช่าวันแรก 150 บาท จำนวน 1 ชุด\n[/ข้อมูลจากป้าย]';
  const result=await c.query('INSERT INTO "Product" (id,name,cat,type,rent,"stockRent","stockSell",status,color,size,chest,waist,hip,length,note,"updatedAt") VALUES ($1,$2,$3,$4,150,1,0,$5,$6,$7,36,31,33,38,$8,NOW()) RETURNING id,name,rent,"stockRent",chest,waist,hip,length',[id,name,'ชุดราตรี','เช่า','พร้อมเช่า','เขียว','XL',note]);
  await c.query('COMMIT');
  fs.mkdirSync('recovery',{recursive:true});
  fs.writeFileSync('recovery/green-dress-added-2026-10-10.json',JSON.stringify(result.rows,null,2));
  console.log(JSON.stringify(result.rows));
 }catch(error){await c.query('ROLLBACK').catch(()=>{});throw error;}finally{await c.end();}
}
main().catch(error=>{console.error(error.code||error.message);process.exitCode=1;});
