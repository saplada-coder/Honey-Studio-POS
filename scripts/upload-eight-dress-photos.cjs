const fs=require('node:fs');
const {Client}=require('pg');
const {put}=require('@vercel/blob');
require('dotenv').config({path:'.env.local',quiet:true});
const ids=['HS-GOLD-007','HS-GREEN-001','HS-ORANGE-001','HS-PINK-065','HS-PINK-100','HS-SKY-002','HS-SKY-003','HS-SKY-022'];
async function main(){
 const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
 try{
  await c.connect();
  const before=await c.query('SELECT * FROM "Product" WHERE id=ANY($1::text[])',[ids]);
  if(before.rows.length!==8)throw Error('Missing product');
  if(before.rows.some(p=>p.image))throw Error('Existing front photo requires preservation before replacement');
  fs.mkdirSync('recovery',{recursive:true});
  fs.writeFileSync('recovery/eight-dress-photos-before-'+Date.now()+'.json',JSON.stringify(before.rows,null,2));
  const uploads=[];
  for(const id of ids){
   const data=fs.readFileSync('C:/Users/ASUS/Pictures/ชุด+รหัส/'+id+'.jpg');
   const blob=await put('products/'+id+'-front.jpg',data,{access:'public',contentType:'image/jpeg',addRandomSuffix:true});
   uploads.push({id,url:blob.url});
  }
  fs.writeFileSync('recovery/eight-dress-photo-uploads.json',JSON.stringify(uploads,null,2));
  await c.query('BEGIN');
  for(const p of uploads){
   const result=await c.query('UPDATE "Product" SET image=$1,"updatedAt"=NOW() WHERE id=$2 AND (image IS NULL OR image=\'\')',[p.url,p.id]);
   if(result.rowCount!==1)throw Error('Product changed during upload');
  }
  await c.query('COMMIT');
  const after=await c.query('SELECT id,image,rent FROM "Product" WHERE id=ANY($1::text[])',[ids]);
  for(const p of after.rows){
   if(p.image!==uploads.find(u=>u.id===p.id).url)throw Error('Photo verification failed');
   const response=await fetch(p.image,{method:'HEAD'});
   if(!response.ok)throw Error('Uploaded image unavailable');
  }
  console.log(JSON.stringify(after.rows.map(p=>({id:p.id,rent:p.rent,photoVerified:true})),null,2));
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{await c.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
