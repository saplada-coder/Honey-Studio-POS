const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({path: '.env.local', quiet: true});
const {Client} = require('pg');
const client = new Client({connectionString: process.env.DATABASE_URL});
const source = JSON.parse(fs.readFileSync(path.join(__dirname, 'blue-stock-data.json'), 'utf8'));
const checked = JSON.parse(fs.readFileSync(path.join(__dirname, 'blue-stock-check-result.json'), 'utf8'));
const apply = process.argv.includes('--apply');
const marker = '[ขนาดสีน้ำเงิน 2026-10-08]';
async function main() {
  if (checked.missing.length || checked.ambiguous.length || checked.existingCount !== 30) throw new Error('Unresolved stock mapping');
  const ids = checked.report.map(p => p.existing.id);
  if (new Set(ids).size !== 30) throw new Error('Duplicate product ID mapping');
  await client.connect();
  await client.query('BEGIN');
  const before = (await client.query('SELECT * FROM "Product" WHERE id = ANY($1::text[]) FOR UPDATE', [ids])).rows;
  if (before.length !== 30) throw new Error('An existing product is missing');
  const changes = [];
  for (let i=0; i<source.rows.length; i++) {
    const [name,c,w,h,length] = source.rows[i];
    const mapping = checked.report[i];
    if (mapping.name !== name) throw new Error('Source order changed');
    const original = before.find(p => p.id === mapping.existing.id);
    if (Number(original.name.match(/^น้ำเงิน\s*(\d+)/)?.[1]) !== Number(name.match(/^น้ำเงิน\s*(\d+)/)?.[1])) throw new Error('Product code changed');
    const chest=c*2, waist=w*2, hip=h*2;
    const cm=Number((length*2.54).toFixed(2));
    const details = [marker,
      `อก ${chest} นิ้ว; เอว ${waist} นิ้ว; สะโพก ${hip} นิ้ว; ยาว ${length} นิ้ว (${cm} ซม.)`,
      `ค่าที่วัดก่อนคูณ 2: อก ${c}; เอว ${w}; สะโพก ${h}`,
      'อก เอว สะโพกคูณ 2 ตามคำสั่ง; ความยาวไม่คูณ',
    ];
    if (name.includes('ซ้ำ')) details.push(name.slice(name.indexOf('ซ้ำ')));
    if (name.includes('ตำหนิ')) details.push('มีตำหนิ');
    if (!Number.isInteger(length)) details.push('ความยาวทศนิยมเก็บในหมายเหตุ; ช่องความยาวเป็น 0 (ไม่ระบุ) เพราะระบบรองรับจำนวนเต็ม ไม่ปัดเศษ');
    details.push('[/ขนาดสีน้ำเงิน]');
    const oldNote = original.note.replace(/\[ขนาดสีน้ำเงิน 2026-10-08\][\s\S]*?\[\/ขนาดสีน้ำเงิน\]/g,'').trim();
    const note = [oldNote,details.join('\n')].filter(Boolean).join('\n\n');
    const storedLength=Number.isInteger(length)?length:0;
    await client.query('UPDATE "Product" SET name=$2,color=$3,chest=$4,waist=$5,hip=$6,length=$7,note=$8,"updatedAt"=CURRENT_TIMESTAMP WHERE id=$1',
      [original.id,name,'น้ำเงิน',chest,waist,hip,storedLength,note]);
    changes.push({id: original.id,name,chest,waist,hip,length,lengthCm:cm,storedLength});
  }
  const after = (await client.query('SELECT * FROM "Product" WHERE id=ANY($1::text[])',[ids])).rows;
  for (const change of changes) {
    const actual=after.find(p=>p.id===change.id), original=before.find(p=>p.id===change.id);
    if (actual.name!==change.name || actual.chest!==change.chest || actual.waist!==change.waist || actual.hip!==change.hip || actual.length!==change.storedLength || !actual.note.includes(`ยาว ${change.length} นิ้ว`)) throw new Error('Measurements verification failed');
    for(const key of ['cat','type','rent','sell','stockRent','stockSell','loc','status','image','imageBack','defects','value','acquired','size']) {
      if(actual[key]!==original[key]) throw new Error(`Unexpected change in ${key}`);
    }
  }
  if (apply) {
    const backup=path.join(__dirname,'blue-stock-before-update.json');
    if(!fs.existsSync(backup)) fs.writeFileSync(backup,JSON.stringify(before,null,2)+'\n');
  }
  await client.query(apply?'COMMIT':'ROLLBACK');
  const result={applied:apply,updatedCount:changes.length,createdCount:0,changes,skippedIncomplete:source.incompleteLines};
  if(apply)fs.writeFileSync(path.join(__dirname,'blue-stock-update-result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}
main().catch(async e=>{await client.query('ROLLBACK').catch(()=>{});console.error(e.message || e.code || 'Database connection failed');process.exitCode=1;}).finally(()=>client.end());
