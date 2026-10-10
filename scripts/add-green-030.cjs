const fs=require('node:fs');const {Client}=require('pg');require('dotenv').config({path:'.env.local',quiet:true});
(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});try{
 await c.connect();await c.query('BEGIN');await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['HS-GREEN-030']);
 const existing=await c.query('SELECT * FROM "Product" WHERE id=$1 OR (color=$2 AND chest=24 AND waist=24 AND hip=28 AND (length=0 OR length=44))',['HS-GREEN-030','เขียว']);
 if(existing.rows.length){console.log(JSON.stringify({existing:existing.rows.map(p=>({id:p.id,name:p.name,rent:p.rent})),added:false}));await c.query('ROLLBACK');return;}
 const note='ข้อมูลจากป้ายเลขเขียน 30: เดรสยาวเกาะอกแต่งเพชร (ซ้ำ 002)\nค่าบนป้ายแนวราบ: อก 12 เอว 12 สะโพก 14 นิ้ว\nรอบตัว: อก 24 เอว 24 สะโพก 28 นิ้ว\nยาว 44.5 นิ้ว 113.03 ซม. ความยาวไม่คูณ\nความยาวทศนิยมเก็บในหมายเหตุ ไม่ปัดเศษ\nค่าเช่าวันแรก 250 บาท';
 const result=await c.query('INSERT INTO "Product" (id,name,cat,type,rent,"stockRent","stockSell",status,color,chest,waist,hip,length,note,"updatedAt") VALUES ($1,$2,$3,$4,250,1,0,$5,$6,24,24,28,0,$7,NOW()) RETURNING id,name,rent,"stockRent",chest,waist,hip',['HS-GREEN-030','สีเขียว 30 เดรสยาวเกาะอกแต่งเพชร (ซ้ำ 002)','ชุดราตรี','เช่า','พร้อมเช่า','เขียว',note]);
 await c.query('COMMIT');fs.mkdirSync('recovery',{recursive:true});fs.writeFileSync('recovery/green-030-added.json',JSON.stringify(result.rows,null,2));console.log(JSON.stringify(result.rows));
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{await c.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
