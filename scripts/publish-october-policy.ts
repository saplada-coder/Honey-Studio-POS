import {config} from 'dotenv';
import {Client} from 'pg';
import {octoberShopPolicy} from '../lib/customer-policy';
config({path:'.env.local',quiet:true});
async function main(){
  const db=new Client({connectionString:process.env.DATABASE_URL});await db.connect();
  try{await db.query('BEGIN');await db.query('INSERT INTO "ShopSettings" (id,data,"updatedAt") VALUES ($1,$2,NOW()) ON CONFLICT (id) DO NOTHING',['main','{}']);const row=(await db.query('SELECT data FROM "ShopSettings" WHERE id=$1 FOR UPDATE',['main'])).rows[0];const data={...JSON.parse(row.data),...octoberShopPolicy};await db.query('UPDATE "ShopSettings" SET data=$2,"updatedAt"=NOW() WHERE id=$1',['main',JSON.stringify(data)]);await db.query('COMMIT');console.log('Published shop-provided October promotion and all three pages of conditions; other shop settings preserved.');}catch(e){await db.query('ROLLBACK');throw e;}finally{await db.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
