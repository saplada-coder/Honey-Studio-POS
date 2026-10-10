const fs=require('node:fs');const {randomUUID}=require('node:crypto');const {Client}=require('pg');const {put}=require('@vercel/blob');require('dotenv').config({path:'.env.local',quiet:true});
const ids=['HS-3220','HS-PINK-010','HS-PINK-030','HS-PINK-034','HS-SKY-001'];
(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL});try{
 await c.connect();const before=await c.query('SELECT * FROM "Product" WHERE id=ANY($1::text[])',[ids]);if(before.rows.length!==5)throw Error('Missing product');
 fs.mkdirSync('recovery',{recursive:true});fs.writeFileSync('recovery/five-photos-before-'+Date.now()+'.json',JSON.stringify(before.rows,null,2));
 const uploads=[];for(const id of ids){const blob=await put('products/'+id+'-front.jpg',fs.readFileSync('C:/Users/ASUS/Pictures/ชุด+รหัส/'+id+'.jpg'),{access:'public',contentType:'image/jpeg',addRandomSuffix:true});uploads.push({id,url:blob.url});}
 fs.writeFileSync('recovery/five-photo-uploads.json',JSON.stringify(uploads,null,2));
 await c.query('BEGIN');for(const upload of uploads){const row=before.rows.find(p=>p.id===upload.id);
  const locked=await c.query('SELECT image FROM "Product" WHERE id=$1 FOR UPDATE',[row.id]);if(locked.rows[0].image!==row.image)throw Error('Photo changed concurrently');
  if(row.image)await c.query('INSERT INTO "StockTrash" (id,kind,"productId",name,snapshot) VALUES ($1,$2,$3,$4,$5)',[randomUUID(),'photo',row.id,row.name,JSON.stringify({field:'image',url:row.image})]);
  await c.query('UPDATE "Product" SET image=$1,"updatedAt"=NOW() WHERE id=$2',[upload.url,row.id]);
 }await c.query('COMMIT');
 const after=await c.query('SELECT id,image,rent FROM "Product" WHERE id=ANY($1::text[])',[ids]);
 for(const row of after.rows){if(row.image!==uploads.find(p=>p.id===row.id).url)throw Error('Verification failed');if(!(await fetch(row.image,{method:'HEAD'})).ok)throw Error('Photo unavailable');}
 console.log(JSON.stringify(after.rows.map(p=>({id:p.id,rent:p.rent,photoVerified:true})),null,2));
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{await c.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
