const fs=require('node:fs'),path=require('node:path');
const attachment='C:/Users/ASUS/.codex/attachments/6a9023b8-c204-4937-a980-f430ca2a80ac/Pasted text.txt';
const text=fs.readFileSync(attachment,'utf8').replace(/\r\n/g,'\n');
const headings=[...text.matchAll(/^(ชุดที่\s+(\d+)|สีชมพู\s+(\d+))([^\n]*)/gm)];
const value=(block,label)=>{
  const found=block.match(new RegExp('^'+label+'\\s*([0-9]+(?:\\.[0-9]+)?(?:\\s*-\\s*[0-9]+(?:\\.[0-9]+)?)?)','m'));
  return found?.[1]||null;
};
const rows=headings.map((heading,index)=>{
  const family=heading[2]?'ชุดที่':'สีชมพูท้ายไฟล์';
  const number=Number(heading[2]||heading[3]);
  const raw=text.slice(heading.index,headings[index+1]?.index||text.length).trim();
  const chest=value(raw,'อก'),waist=value(raw,'เอว'),hip=value(raw,'สะ(?:โพก)?');
  const lengths=[...raw.matchAll(/^ยาว\s*([^\n]*)/gm)].map(m=>m[1]);
  const multiplier=(family==='ชุดที่'&&number<=8)||(family==='สีชมพูท้ายไฟล์'&&number>=102)?1:2;
  return {family,number,heading:heading[0].trim(),chestSource:chest,waistSource:waist,hipSource:hip,lengthSource: lengths,rawSource:raw,multiplier,defective:heading[0].includes('ตำหนิ')||(family==='ชุดที่'&&(number===86||number===87))};
});
if(rows.length!==103||rows.filter(p=>p.family==='ชุดที่').length!==94)throw new Error('Unexpected source count');
const result={status:'user confirmed measurement multipliers and separate physical items',additionalCodeMapping:{1:95,2:96,3:97,4:98},rows,sourceText:text};
fs.writeFileSync(path.join(__dirname,'pink-stock-prepared.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({total:rows.length,described:94,additional:9,missingMeasurements:rows.filter(r=>!r.chestSource||!r.waistSource||!r.hipSource).map(r=>({family:r.family,number:r.number,chest:r.chestSource,waist:r.waistSource,hip:r.hipSource})),ranges:rows.filter(r=>[r.chestSource,r.waistSource,r.hipSource].some(v=>v?.includes('-'))).map(r=>({family:r.family,number:r.number,chest:r.chestSource,waist:r.waistSource})),splitLengthNumbers:[10,43,73],unlabelledLengthNumber:94},null,2));
if(process.argv.includes('--inspect')){
  require('dotenv').config({path:'.env.local',quiet:true});
  const {Client}=require('pg');const client=new Client({connectionString:process.env.DATABASE_URL});
  (async()=>{await client.connect();console.log(JSON.stringify((await client.query('SELECT id,name,color,chest,waist,hip,length FROM "Product" WHERE name LIKE $1 OR color LIKE $1',['%ชมพู%'])).rows,null,2));await client.end();})().catch(e=>{console.error(e.message||e.code||'Database connection failed');process.exitCode=1;client.end();});
}
