require('dotenv').config({path:'.env.local',quiet:true});
const {Client}=require('pg');
const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000,query_timeout:20000});
const items=[
 ['HS-BROWN-026','น้ำตาล 026','น้ำตาล',17,16,19,49,''],
 ['HS-BROWN-019','น้ำตาล 019','น้ำตาล',15.5,15,20,58,'ซ้ำ 001 น้ำตาล 018'],
 ['HS-BROWN-025','น้ำตาล 025','น้ำตาล',15,14,16,54,''],
 ['HS-BROWN-027','น้ำตาล 027','น้ำตาล',15,13,16,53.5,''],
 ['HS-BROWN-032','น้ำตาล 032','น้ำตาล',15,15,18,48.5,''],
 ['HS-ORANGE-005','ส้มแสด 05','ส้ม',22,18,21,37,''],
 ['HS-BROWN-002','น้ำตาล 02','น้ำตาล',16,14,19.5,53,'ซ้ำ / 001 น้ำตาล 01']
];
(async()=>{await c.connect();await c.query('BEGIN');try{await c.query('LOCK TABLE "Product" IN SHARE ROW EXCLUSIVE MODE');const changes=[];for(const [id,name,color,chest,waist,hip,length,extra] of items){const old=(await c.query('SELECT id FROM "Product" WHERE id=$1',[id])).rows;if(old.length)throw Error('Code already exists: '+id);const note=`[เพิ่มจากภาพป้าย 2026-10-21]\nต้นฉบับ: ${name}; อก ${chest}; เอว ${waist}; สะโพก ${hip}; ยาว ${length} นิ้ว (${(length*2.54).toFixed(2)} ซม.)\nอก เอว สะโพกบนป้ายเป็นแนวราบ คูณ 2 เป็นรอบตัว; ความยาวไม่คูณ\n${extra}\nยังไม่ระบุราคาและไซส์${Number.isInteger(length)?'':'\nความยาวทศนิยมเก็บครบในหมายเหตุ ช่อง length เป็น 0 เพราะรองรับจำนวนเต็ม ไม่ปัดเศษ'}`;await c.query('INSERT INTO "Product" (id,name,cat,type,color,chest,waist,hip,length,note,"stockRent","stockSell","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,0,CURRENT_TIMESTAMP)',[id,name,'ชุดราตรี','เช่า',color,chest*2,waist*2,hip*2,Number.isInteger(length)?length:0,note]);changes.push(id);}const verified=(await c.query('SELECT id,chest,waist,hip,length,"stockRent",note FROM "Product" WHERE id=ANY($1::text[])',[changes])).rows;for(const [id,, ,chest,waist,hip,length] of items){const p=verified.find(p=>p.id===id);if(!p||p.chest!==chest*2||p.waist!==waist*2||p.hip!==hip*2||p.stockRent!==1||!p.note.includes(`ยาว ${length} นิ้ว`))throw Error('Verification failed: '+id);}await c.query('COMMIT');console.log(JSON.stringify({created:changes.length,codes:changes}));}catch(e){await c.query('ROLLBACK');throw e;}})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>c.end());
