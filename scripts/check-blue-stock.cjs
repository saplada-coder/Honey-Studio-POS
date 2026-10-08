const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({path: '.env.local', quiet: true});
const {Client} = require('pg');
const client = new Client({connectionString: process.env.DATABASE_URL});
const source = JSON.parse(fs.readFileSync(path.join(__dirname, 'blue-stock-data.json'), 'utf8'));
const code = name => Number(name.match(/^น้ำเงิน\s*(\d+)/)?.[1]);
(async () => {
  await client.connect();
  const products = (await client.query('SELECT id,name,chest,waist,hip,length FROM "Product" WHERE name LIKE $1', ['น้ำเงิน%'])).rows;
  const report = source.rows.map(([name,c,w,h,l]) => {
    const candidates = products.filter(p => code(p.name) === code(name));
    const matches = candidates.filter(p => p.chest === c*2 && p.waist === w*2 && p.hip === h*2);
    const match = matches.length === 1 ? matches[0] : candidates.length === 1 ? candidates[0] : null;
    return {name, existing: match, missing: candidates.length === 0, ambiguous: candidates.length > 1 && !match, supplied: {chest: c*2,waist: w*2,hip: h*2,length: l}};
  });
  const result = {suppliedCount: source.rows.length, existingCount: report.filter(p => p.existing).length, missing: report.filter(p => p.missing), ambiguous: report.filter(p => p.ambiguous), report, incompleteLines: source.incompleteLines};
  fs.writeFileSync(path.join(__dirname, 'blue-stock-check-result.json'), JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
  await client.end();
})().catch(e => { console.error(e.message || e.code || 'Database connection failed'); process.exitCode=1; client.end(); });
