require('dotenv').config({path:'.env.local',quiet:true});
const {Client}=require('pg');
const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000,query_timeout:20000});
(async()=>{await c.connect();const rows=(await c.query('SELECT id,name,color,chest,waist,hip,length,note FROM "Product"')).rows;console.log(JSON.stringify({colors:[...new Set(rows.map(p=>p.color))],matches:rows.filter(p=>/น้ำตาล|ส้มแสด|BROWN|แสด/.test(p.name+' '+p.id+' '+p.note)||[[34,32,38],[31,30,40],[30,28,32],[30,26,32],[30,30,36],[44,36,42],[32,28,39]].some(s=>p.chest===s[0]&&p.waist===s[1]&&p.hip===s[2]))},null,2));})().catch(e=>{console.error(e.message);process.exitCode=1}).finally(()=>c.end());
