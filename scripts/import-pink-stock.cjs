const fs=require('node:fs'),path=require('node:path');
require('dotenv').config({path:'.env.local',quiet:true});
const {Client}=require('pg');
const client=new Client({connectionString:process.env.DATABASE_URL});
const source=JSON.parse(fs.readFileSync(path.join(__dirname,'pink-stock-prepared.json'),'utf8'));
const apply=process.argv.includes('--apply');
const parseCode=name=>Number(name.match(/^(?:สี)?ชมพู\s*(\d+)/)?.[1]);
const marker='[ขนาดสีชมพู 2026-10-08]';
const convert=(value,multiplier)=>value===null?{label:'ไม่ระบุ',stored:0}:value.includes('-')?{label:value.split(/\s*-\s*/).map(v=>Number(v)*multiplier).join('–'),stored:0}:{label:String(Number(value)*multiplier),stored:Number(value)*multiplier};
async function main(){
  if(source.rows.length!==103)throw new Error('Unexpected source count');
  await client.connect();await client.query('BEGIN');await client.query('LOCK TABLE "Product" IN SHARE ROW EXCLUSIVE MODE');
  const all=(await client.query('SELECT * FROM "Product"')).rows,ids=new Set(all.map(p=>p.id)),used=new Set(),changes=[],before=[];
  for(const row of source.rows){
    const isExtra=row.family==='สีชมพูท้ายไฟล์';
    const number=isExtra&&row.number<=4?row.number+94:row.number;
    const multiplier=(!isExtra&&row.number<=8)||(isExtra&&row.number>=102)?1:2;
    const chest=convert(row.chestSource,multiplier),waist=convert(row.waistSource,multiplier),hip=convert(row.hipSource,multiplier);
    const split=!isExtra&&[10,43,73].includes(row.number);
    let length=null;
    if(!split){const lengthMatch=row.lengthSource[0]?.match(/^\s*(\d+(?:\.\d+)?)/);if(lengthMatch)length=Number(lengthMatch[1]);}
    if(!isExtra&&row.number===94)length=47;
    const storedLength=Number.isInteger(length)?length:0;
    const candidates=all.filter(p=>parseCode(p.name)===number);
    const exact=candidates.filter(p=>p.chest===chest.stored&&p.waist===waist.stored&&p.hip===hip.stored);
    const original=candidates.length===1?candidates[0]:exact.length===1?exact[0]:null;
    if(candidates.length&&!original)throw new Error(`Ambiguous pink code ${number}`);
    const key=String(number).padStart(3,'0');let id=original?.id||`HS-PINK-${key}`;
    if(!original){let suffix=2;while(ids.has(id))id=`HS-PINK-${key}-${suffix++}`;}
    if(used.has(id))throw new Error('Duplicate ID mapping');used.add(id);ids.add(id);
    const description=row.heading.replace(/^(?:ชุดที่|สีชมพู)\s*\d+\s*/,'').replace(/[•+]/g,'').trim();
    const displayCode=number<10?String(number).padStart(2,'0'):`0${number}`;
    const name=`สีชมพู ${displayCode}${description?' '+description:''}`;
    const cm=length===null?null:Number((length*2.54).toFixed(2));
    const notes=[marker,`อก ${chest.label} นิ้ว; เอว ${waist.label} นิ้ว; สะโพก ${hip.label} นิ้ว`,multiplier===1?'ใช้ค่ารอบตัวตามต้นฉบับ ไม่คูณซ้ำ':'อก เอว สะโพกคูณ 2 ตามคำยืนยันผู้ใช้','ความยาวไม่คูณ'];
    if(length!==null)notes.push(`ยาว ${length} นิ้ว (${cm} ซม.)`);
    if(split)notes.push('ชุดแยกเสื้อ/กระโปรง ไม่มีความยาวรวม; เก็บความยาวแต่ละชิ้นตามต้นฉบับด้านล่าง');
    if(!split&&length!==null&&!Number.isInteger(length))notes.push('ความยาวทศนิยมเก็บในหมายเหตุ ช่อง length เป็น 0 (ไม่ระบุ) เนื่องจากระบบรับจำนวนเต็ม ไม่ปัดเศษ');
    if([row.chestSource,row.waistSource,row.hipSource].some(v=>v?.includes('-')))notes.push('ขนาดที่เป็นช่วงเก็บครบในหมายเหตุ ช่องขนาดนั้นเป็น 0 (ไม่ระบุ)');
    if(!row.hipSource)notes.push('รอตรวจสอบ: ต้นฉบับไม่ระบุสะโพก ไม่เดาค่า');
    if(!row.chestSource)notes.push('ต้นฉบับไม่ระบุอก (รายการกระโปรง)');
    if(row.defective)notes.push('มีตำหนิ'+(!isExtra&&[86,87].includes(row.number)?' ตามหัวข้อเก็บตกตำหนิ':''));
    if(isExtra&&row.number<=4)notes.push(`เลขท้ายไฟล์ ${row.number} แยกเป็นรหัส ${displayCode} ตามคำยืนยันว่าเป็นคนละตัว`);
    notes.push('ต้นฉบับ (เก็บทั้งรายละเอียดชุด ขนาด และค่าซม.ที่อาจต่างจากการคำนวณ):',row.rawSource,'[/ขนาดสีชมพู]');
    const oldNote=(original?.note||'').replace(/\[ขนาดสีชมพู 2026-10-08\][\s\S]*?\[\/ขนาดสีชมพู\]/g,'').trim();
    const note=[oldNote,notes.join('\n')].filter(Boolean).join('\n\n');
    if(original){before.push(original);await client.query('UPDATE "Product" SET name=$2,color=$3,chest=$4,waist=$5,hip=$6,length=$7,note=$8,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$1',[id,name,'ชมพู',chest.stored,waist.stored,hip.stored,storedLength,note]);}
    else await client.query('INSERT INTO "Product" (id,name,cat,type,color,chest,waist,hip,length,note,"stockRent","stockSell","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,0,CURRENT_TIMESTAMP)',[id,name,'ชุดราตรี','เช่า','ชมพู',chest.stored,waist.stored,hip.stored,storedLength,note]);
    changes.push({id,name,number,multiplier,chest,waist,hip,length,storedLength,split,defective:row.defective,action:original?'updated':'created'});
  }
  const after=(await client.query('SELECT * FROM "Product" WHERE id=ANY($1::text[])',[changes.map(p=>p.id)])).rows;
  if(after.length!==103||new Set(changes.map(p=>p.number)).size!==103)throw new Error('Unexpected imported count');
  for(const change of changes){
    const actual=after.find(p=>p.id===change.id),original=before.find(p=>p.id===change.id);
    if(actual.name!==change.name||actual.chest!==change.chest.stored||actual.waist!==change.waist.stored||actual.hip!==change.hip.stored||actual.length!==change.storedLength||!actual.note.includes(marker))throw new Error('Measurement verification failed');
    if(original){for(const key of ['cat','type','rent','sell','stockRent','stockSell','loc','status','image','imageBack','defects','value','acquired','size'])if(actual[key]!==original[key])throw new Error(`Unexpected ${key} change`);}
    else if(actual.stockRent!==1||actual.stockSell!==0)throw new Error('Wrong initial stock');
  }
  if(apply){const backup=path.join(__dirname,'pink-stock-before-update.json');if(!fs.existsSync(backup))fs.writeFileSync(backup,JSON.stringify(before,null,2)+'\n');}
  await client.query(apply?'COMMIT':'ROLLBACK');
  const result={applied:apply,total:changes.length,createdCount:changes.filter(p=>p.action==='created').length,updatedCount:before.length,defectiveCount:changes.filter(p=>p.defective).length,changes};
  if(apply)fs.writeFileSync(path.join(__dirname,'pink-stock-import-result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({applied:result.applied,total:result.total,createdCount:result.createdCount,updatedCount:result.updatedCount,defectiveCount:result.defectiveCount,updates:changes.filter(p=>p.action==='updated'),additionalCodes:changes.filter(p=>p.number>=95).map(p=>({id:p.id,name:p.name,multiplier:p.multiplier}))},null,2));
}
main().catch(async e=>{await client.query('ROLLBACK').catch(()=>{});console.error(e.message||e.code||'Database connection failed');process.exitCode=1;}).finally(()=>client.end());
