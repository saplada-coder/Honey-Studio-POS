const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
function compile(file){return ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;}
function load(code,mocks={}){
  const exports={};vm.runInNewContext(code,{exports,require:name=>{if(!(name in mocks))throw new Error('Unexpected import: '+name);return mocks[name];}});return exports;
}
const availability=load(compile('lib/booking-availability.ts'));
const route=compile('app/api/rentals/[id]/route.ts');
function fixture(options={}){
  let row={id:'R1',code:'P1',cust:'Customer',phone:'0800000000',userId:'',status:'คืนแล้ว',stockApplied:true,stockReturned:true,online:false,start:'2026-12-01',end:'2026-12-03',...options.row};
  let product={id:'P1',type:'เช่า',status:'พร้อม',stockRent:1,...options.product};
  const reservations=options.reservations||[];
  const tx={
    $queryRaw:async()=>[],
    rental:{
      findUniqueOrThrow:async()=>({...row}),findMany:async()=>reservations,
      update:async({data})=>Object.assign(row,data),
      updateMany:async({where,data})=>{if(row.stockReturned!==where.stockReturned||row.stockApplied!==where.stockApplied)return {count:0};Object.assign(row,data);return {count:1};},
    },
    product:{
      findUnique:async()=>({...product}),
      updateMany:async()=>{if(product.stockRent<1||['ซัก','ซ่อม','ปลดสต็อก'].includes(product.status)||!['เช่า','ทั้งคู่'].includes(product.type))return {count:0};product.stockRent--;return {count:1};},
      update:async()=>{product.stockRent++;return product;},
    },
  };
  const api=load(route,{
    'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
    '@/lib/prisma':{prisma:{$transaction:async fn=>{const beforeRow={...row},beforeProduct={...product};try{return await fn(tx);}catch(error){row=beforeRow;product=beforeProduct;throw error;}}}},
    '@/lib/customer-rewards':{awardReturnPoint:async()=>{},refundUnusedReward:async()=>{}},
    '@/lib/member-link':{validateMember:async()=>{throw new Error('Unexpected member edit');}},
    '@/lib/booking-availability':availability,
  });
  return {patch:body=>api.PATCH({json:async()=>body},{params:Promise.resolve({id:'R1'})}),row:()=>row,stock:()=>product.stockRent};
}
for(const status of ['จองแล้ว','รับชุดแล้ว','กำลังเช่า','เกินกำหนด'])test('reopen as '+status,async()=>{
  const f=fixture();assert.equal((await f.patch({status,cust:'Customer',phone:'0800000000',userId:''})).status,200);
  assert.equal(f.stock(),0);assert.equal(f.row().stockReturned,false);
  assert.equal((await f.patch({status})).status,200);assert.equal(f.stock(),0);
  assert.equal((await f.patch({status:'คืนแล้ว'})).status,200);assert.equal(f.stock(),1);
  await f.patch({status:'คืนแล้ว'});assert.equal(f.stock(),1);
});
for(const product of [{stockRent:0},{status:'ซัก'},{status:'ซ่อม'},{status:'ปลดสต็อก'}])test('unavailable '+JSON.stringify(product),async()=>{
  const f=fixture({product});assert.equal((await f.patch({status:'กำลังเช่า'})).status,409);assert.equal(f.row().stockReturned,true);
});
test('overlapping reservation prevents reopening',async()=>{
  const f=fixture({reservations:[{start:'2026-12-01',end:'2026-12-03',status:'จองแล้ว',stockApplied:false,stockReturned:false}]});
  assert.equal((await f.patch({status:'จองแล้ว'})).status,409);assert.equal(f.stock(),1);
});
test('member changes remain protected',async()=>{
  const f=fixture();assert.equal((await f.patch({status:'กำลังเช่า',phone:'0899999999'})).status,409);assert.equal(f.stock(),1);
});
test('unknown status is rejected',async()=>{
  const f=fixture();assert.equal((await f.patch({status:'unknown'})).status,409);assert.equal(f.stock(),1);
});
test('reopen online rental claims stock once',async()=>{
  const f=fixture({row:{online:true,userId:'U1',paymentStatus:'ชำระแล้ว'}});assert.equal((await f.patch({status:'กำลังเช่า'})).status,200);assert.equal(f.stock(),0);
});
for(const paymentMethod of ['เงินสด','โอน',''])test('save payment method '+paymentMethod,async()=>{
  const f=fixture();assert.equal((await f.patch({paymentMethod})).status,200);assert.equal(f.row().paymentMethod,paymentMethod);assert.equal(f.stock(),1);
});
test('reject unsupported payment method',async()=>{
  const f=fixture();assert.equal((await f.patch({paymentMethod:'other'})).status,409);assert.equal(f.row().paymentMethod,undefined);
});
