const fs=require('node:fs');
const path=require('node:path');
const {Client}=require('pg');
require('dotenv').config({path:path.join(__dirname,'../.env.local'),quiet:true});
async function main(){
  const root=path.join(__dirname,'..');
  if(process.argv.includes('--download')){
    const blobs=JSON.parse(fs.readFileSync(path.join(root,'recovery','unlinked-stock-images.json'),'utf8'));
    const folder=path.join(root,'recovery','images');fs.mkdirSync(folder,{recursive:true});
    let downloaded=0;
    for(let index=0;index<blobs.length;index+=6)await Promise.all(blobs.slice(index,index+6).map(async blob=>{
      const response=await fetch(blob.url,{signal:AbortSignal.timeout(30000)});
      if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('Image unavailable: '+blob.pathname);
      const bytes=Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(path.join(folder,path.basename(blob.pathname)),bytes);downloaded++;
    }));
    console.log(JSON.stringify({downloaded,folder}));return;
  }
  const older=JSON.parse(fs.readFileSync(path.join(root,'../dress-rent-backup-2026-10-08T11-53-43-869Z.json'),'utf8')).products;
  console.log('Backup fields:',Object.keys(older[0]));
  const sources=[...older];
  function collect(data){
    if(Array.isArray(data))data.forEach(collect);
    else if(data&&typeof data==='object'){
      if(data.id&&(data.image||data.imageBack))sources.push(data);
      else Object.values(data).forEach(collect);
    }
  }
  for(const file of fs.readdirSync(__dirname).filter(file=>file.endsWith('.json')&&!file.startsWith('dress-photos-')))collect(JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8')));
  for(const file of ['dress-photos-before.json','dress-photos-result.json'])sources.push(...JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8')));
  const byId=new Map();
  for(const product of sources){
    const entry=byId.get(product.id)||{};
    for(const field of ['image','imageBack'])if(product[field])entry[field]=product[field];
    byId.set(product.id,entry);
  }
  const client=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
  try{
    await client.connect();
    const {rows}=await client.query('SELECT id,name,image,"imageBack" FROM "Product" ORDER BY id');
    if(process.argv.includes('--blobs')||process.argv.includes('--recover-all')){
      const {list}=require('@vercel/blob');let cursor;const blobs=[];
      do{const page=await list({prefix:'products/',limit:1000,...(cursor?{cursor}:{})});blobs.push(...page.blobs);cursor=page.hasMore?page.cursor:undefined;}while(cursor);
      const linked=new Set(rows.flatMap(p=>[p.image,p.imageBack]).filter(Boolean));
      const orphans=blobs.filter(blob=>!linked.has(blob.url));
      fs.mkdirSync(path.join(root,'recovery'),{recursive:true});
      fs.writeFileSync(path.join(root,'recovery','unlinked-stock-images.json'),JSON.stringify(orphans,null,2));
      if(process.argv.includes('--recover-all')){
        const before=await client.query('SELECT * FROM "StockTrash"');
        fs.writeFileSync(path.join(root,'recovery','trash-before-'+Date.now()+'.json'),JSON.stringify(before.rows,null,2));
        const {randomUUID}=require('node:crypto');
        let added=0;
        await client.query('BEGIN');
        try{
          for(const blob of orphans){
            const original=sources.find(product=>product.image===blob.url||product.imageBack===blob.url);
            const existing=original&&rows.find(product=>product.id===original.id);
            const field=original?.imageBack===blob.url?'imageBack':'image';
            const data=await client.query('INSERT INTO "StockTrash" (id,"sourceKey",kind,"productId",name,snapshot) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT ("sourceKey") DO NOTHING',[
              randomUUID(),blob.url,existing?'photo':'recovered-photo',existing?.id||'',existing?.name||blob.pathname,JSON.stringify({url:blob.url,field,pathname:blob.pathname})
            ]);
            added+=data.rowCount;
          }
          await client.query('COMMIT');
        }catch(error){await client.query('ROLLBACK');throw error;}
        const verified=await client.query('SELECT COUNT(*)::int AS count FROM "StockTrash" WHERE "sourceKey"=ANY($1::text[])',[orphans.map(blob=>blob.url)]);
        if(verified.rows[0].count!==orphans.length)throw Error('Recovered image count mismatch');
        console.log(JSON.stringify({retainedImages:orphans.length,newTrashEntries:added,verified:verified.rows[0].count}));return;
      }
      console.log(JSON.stringify({blobs:blobs.length,unlinked:orphans.length,paths:orphans.map(blob=>blob.pathname)},null,2));return;
    }
    if(process.argv.includes('--audit')){
      const photos=rows.flatMap(p=>['image','imageBack'].filter(field=>p[field]).map(field=>({id:p.id,field,url:p[field]})));
      const failures=[];
      for(let i=0;i<photos.length;i+=8)await Promise.all(photos.slice(i,i+8).map(async p=>{
        try{const response=await fetch(p.url,{method:'HEAD',signal:AbortSignal.timeout(10000)});if(!response.ok)failures.push({id:p.id,field:p.field,status:response.status});}
        catch{failures.push({id:p.id,field:p.field,status:'network-error'});}
      }));
      console.log(JSON.stringify({checked:photos.length,failures},null,2));
      return;
    }
    const candidates=[];
    for(const product of rows)for(const field of ['image','imageBack'])if(!product[field]&&byId.get(product.id)?.[field])candidates.push({id:product.id,name:product.name,field,url:byId.get(product.id)[field]});
    console.log(JSON.stringify({totalProducts:rows.length,missingAllPhotos:rows.filter(p=>!p.image&&!p.imageBack).length,recoverable:candidates.map(({url,...p})=>p)},null,2));
    if(!process.argv.includes('--apply'))return;
    const verified=[];
    for(const candidate of candidates){
      const response=await fetch(candidate.url,{method:'HEAD',signal:AbortSignal.timeout(10000)});
      if(response.ok&&response.headers.get('content-type')?.startsWith('image/'))verified.push(candidate);
      else console.log('Skipped unavailable image:',candidate.id,candidate.field,response.status);
    }
    fs.mkdirSync(path.join(root,'recovery'),{recursive:true});
    const file=path.join(root,'recovery','stock-photos-before-'+Date.now()+'.json');
    fs.writeFileSync(file,JSON.stringify(rows,null,2));
    await client.query('BEGIN');
    let restored=0;
    try{
      for(const p of verified){
        const result=await client.query(`UPDATE "Product" SET "${p.field}"=$1,"updatedAt"=NOW() WHERE id=$2 AND "${p.field}"=''`,[p.url,p.id]);
        restored+=result.rowCount;
      }
      await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK');throw error;}
    const after=await client.query('SELECT id,image,"imageBack" FROM "Product" WHERE id=ANY($1::text[])',[verified.map(p=>p.id)]);
    for(const p of verified)if(!after.rows.find(r=>r.id===p.id)?.[p.field])throw Error('Recovery verification failed: '+p.id);
    console.log(JSON.stringify({restored,backup:file}));
  }finally{await client.end();}
}
main().catch(error=>{console.error(error.code||error.message);process.exitCode=1;});
