import assert from 'node:assert/strict';
import {removedStockPhotos,preserveStockPhotos} from '../lib/stock-trash';
async function main(){
  const product={id:'test',name:'ทดสอบ',image:'front',imageBack:'back',defects:'["scratch-1","scratch-2"]'};
  assert.deepEqual(removedStockPhotos(product,{name:'ชื่อใหม่'}),[]);
  assert.deepEqual(removedStockPhotos(product,{image:'front'}),[]);
  assert.deepEqual(removedStockPhotos(product,{image:''}),[{field:'image',url:'front'}]);
  assert.deepEqual(removedStockPhotos(product,{image:'new'}),[{field:'image',url:'front'}]);
  assert.deepEqual(removedStockPhotos(product,{imageBack:'',defects:'["scratch-2"]'}),[{field:'imageBack',url:'back'},{field:'defects',url:'scratch-1'}]);
  const records:any[]=[];
  await preserveStockPhotos({stockTrash:{create:async({data}:any)=>records.push(data)}} as any,product,{image:'',imageBack:''});
  assert.equal(records.length,2);
  for(const record of records){assert.equal(record.productId,'test');assert.equal(record.kind,'photo');assert.ok(JSON.parse(record.snapshot).url);}
  console.log('PASS: deleted/replaced photos retained, unchanged images ignored, defect photo differences and original product identity preserved');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
