const fs=require('node:fs');const {Client}=require('pg');require('dotenv').config({path:'.env.local',quiet:true});
const ids=['HS-SKY-001','HS-PINK-030','HS-3220','HS-PINK-010','HS-PINK-034'];
(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL});try{
 await c.connect();await c.query('BEGIN');
 const before=await c.query('SELECT * FROM "Product" WHERE id=ANY($1::text[]) FOR UPDATE',[ids]);
 if(before.rows.length!==5)throw Error('Missing products');
 fs.mkdirSync('recovery',{recursive:true});fs.writeFileSync('recovery/five-dress-rents-before-'+Date.now()+'.json',JSON.stringify(before.rows,null,2));
 await c.query('UPDATE "Product" SET rent=150,"updatedAt"=NOW() WHERE id=ANY($1::text[])',[ids]);
 const result=await c.query('SELECT id,name,rent FROM "Product" WHERE id=ANY($1::text[]) ORDER BY id',[ids]);
 if(result.rows.some(p=>p.rent!==150))throw Error('Verification failed');
 await c.query('COMMIT');console.log(JSON.stringify(result.rows,null,2));
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{await c.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
