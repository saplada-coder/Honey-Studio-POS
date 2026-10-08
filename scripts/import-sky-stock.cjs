const fs=require('node:fs'),path=require('node:path');
require('dotenv').config({path:'.env.local',quiet:true});
const {Client}=require('pg');
const client=new Client({connectionString:process.env.DATABASE_URL});
const source=JSON.parse(fs.readFileSync(path.join(__dirname,'sky-stock-data.json'),'utf8'));
const apply=process.argv.includes('--apply');
const code=name=>Number(name.match(/^(?:สี)?ฟ้า\s*(\d+)/)?.[1]);
const marker='[ขนาดสีฟ้า 2026-10-08]';
async function main(){
  await client.connect();await client.query('BEGIN');
  await client.query('LOCK TABLE "Product" IN SHARE ROW EXCLUSIVE MODE');
  const all=(await client.query('SELECT * FROM "Product"')).rows;
  const ids=new Set(all.map(p=>p.id)),used=new Set(),changes=[],before=[];
  let created=0,updated=0;
  for(const [name,c,w,h,length] of source.rows){
    const number=code(name),key=String(number).padStart(3,'0');
    const candidates=all.filter(p=>code(p.name)===number);
    const exact=candidates.filter(p=>p.chest===c*2&&p.waist===w*2&&p.hip===h*2);
    const original=candidates.length===1?candidates[0]:exact.length===1?exact[0]:null;
    if(candidates.length&&!original)throw new Error(`Ambiguous existing products: ${name}`);
    let id=original?.id||`HS-SKY-${key}`;
    if(!original){let suffix=2;while(ids.has(id))id=`HS-SKY-${key}-${suffix++}`;}
    if(used.has(id))throw new Error('Duplicate mapping');used.add(id);ids.add(id);
    const chest=c*2,waist=w*2,hip=h*2,cm=Number((length*2.54).toFixed(2));
    const storedLength=Number.isInteger(length)?length:0;
    const notes=[marker,`อก ${chest} นิ้ว; เอว ${waist} นิ้ว; สะโพก ${hip} นิ้ว; ยาว ${length} นิ้ว (${cm} ซม.)`,`ค่าที่วัดก่อนคูณ 2: อก ${c}; เอว ${w}; สะโพก ${h}`,'อก เอว สะโพกคูณ 2; ความยาวไม่คูณ'];
    if(name.includes('ซ้ำ'))notes.push(name.slice(name.indexOf('ซ้ำ')));
    if(name.includes('ตำหนิ'))notes.push('มีตำหนิ');
    if(number===22||number===23)notes.push('งานตำหนิแยก 2 ตัว ไม่นับรวมยอดงานปกติ 14 + งานซ้ำ 8 = 22 ตัว ตามสรุปผู้ใช้');
    if(!Number.isInteger(length))notes.push('ความยาวทศนิยมเก็บครบในหมายเหตุ ช่องความยาวเป็น 0 (ไม่ระบุ) เพราะระบบรองรับจำนวนเต็ม ไม่ปัดเศษ');
    if(source.sourceWarnings[key])notes.push(source.sourceWarnings[key]);
    notes.push('[/ขนาดสีฟ้า]');
    const oldNote=(original?.note||'').replace(/\[ขนาดสีฟ้า 2026-10-08\][\s\S]*?\[\/ขนาดสีฟ้า\]/g,'').trim();
    const note=[oldNote,notes.join('\n')].filter(Boolean).join('\n\n');
    if(original){
      before.push(original);
      await client.query('UPDATE "Product" SET name=$2,color=$3,chest=$4,waist=$5,hip=$6,length=$7,note=$8,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$1',[id,name,'ฟ้า',chest,waist,hip,storedLength,note]);updated++;
    }else{
      await client.query('INSERT INTO "Product" (id,name,cat,type,color,chest,waist,hip,length,note,"stockRent","stockSell","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,0,CURRENT_TIMESTAMP)',[id,name,'ชุดราตรี','เช่า','ฟ้า',chest,waist,hip,storedLength,note]);created++;
    }
    changes.push({id,name,chest,waist,hip,length,lengthCm:cm,storedLength,action:original?'updated':'created'});
  }
  const after=(await client.query('SELECT * FROM "Product" WHERE id=ANY($1::text[])',[changes.map(p=>p.id)])).rows;
  if(after.length!==24)throw new Error('Wrong count');
  for(const change of changes){
    const actual=after.find(p=>p.id===change.id),original=before.find(p=>p.id===change.id);
    if(actual.name!==change.name||actual.chest!==change.chest||actual.waist!==change.waist||actual.hip!==change.hip||actual.length!==change.storedLength||!actual.note.includes(`ยาว ${change.length} นิ้ว`))throw new Error('Size verification failed');
    if(original){for(const key of ['cat','type','rent','sell','stockRent','stockSell','loc','status','image','imageBack','defects','value','acquired','size'])if(actual[key]!==original[key])throw new Error(`Unexpected ${key} change`);}
    else if(actual.stockRent!==1||actual.stockSell!==0)throw new Error('Wrong initial stock');
  }
  if(apply){const backup=path.join(__dirname,'sky-stock-before-update.json');if(!fs.existsSync(backup))fs.writeFileSync(backup,JSON.stringify(before,null,2)+'\n');}
  await client.query(apply?'COMMIT':'ROLLBACK');
  const result={applied:apply,createdCount:created,updatedCount:updated,total:changes.length,changes,sourceSummary:source.sourceSummary,warnings:source.sourceWarnings};
  if(apply)fs.writeFileSync(path.join(__dirname,'sky-stock-import-result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}
main().catch(async e=>{await client.query('ROLLBACK').catch(()=>{});console.error(e.message||e.code||'Database connection failed');process.exitCode=1;}).finally(()=>client.end());
