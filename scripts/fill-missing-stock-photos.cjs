const fs=require('node:fs');const {Client}=require('pg');const {put}=require('@vercel/blob');require('dotenv').config({path:'.env.local',quiet:true});
const folder='C:/Users/ASUS/Pictures/ชุด+รหัส';
(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});try{
 await c.connect();const files=fs.readdirSync(folder).filter(f=>/^HS-.+\.jpg$/i.test(f));const ids=files.map(f=>f.slice(0,-4));
 const {rows}=await c.query('SELECT id,name,image,"imageBack",rent FROM "Product" WHERE id=ANY($1::text[])',[ids]);const missing=rows.filter(p=>!p.image);
 fs.mkdirSync('recovery',{recursive:true});fs.writeFileSync('recovery/missing-photos-before-'+Date.now()+'.json',JSON.stringify(missing,null,2));
 const updates=[];for(const p of missing){const blob=await put('products/'+p.id+'-front.jpg',fs.readFileSync(folder+'/'+files.find(f=>f.slice(0,-4)===p.id)),{access:'public',contentType:'image/jpeg',addRandomSuffix:true});updates.push({id:p.id,url:blob.url});}
 fs.writeFileSync('recovery/missing-photo-uploads-'+Date.now()+'.json',JSON.stringify(updates,null,2));await c.query('BEGIN');
 for(const u of updates){const result=await c.query('UPDATE "Product" SET image=$1,"updatedAt"=NOW() WHERE id=$2 AND (image=\'\' OR image IS NULL)',[u.url,u.id]);if(result.rowCount!==1)throw Error('Product photo changed');}
 await c.query('COMMIT');for(const u of updates){const r=await c.query('SELECT image FROM "Product" WHERE id=$1',[u.id]);if(r.rows[0].image!==u.url||!(await fetch(u.url,{method:'HEAD'})).ok)throw Error('Verification failed');}
 console.log(JSON.stringify({added:updates.map(u=>u.id),alreadyHavePhoto:rows.filter(p=>p.image).map(p=>p.id),unmatchedFiles:ids.filter(id=>!rows.some(p=>p.id===id))}));
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{await c.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
