import type {Prisma} from '@/app/generated/prisma/client';
export function removedStockPhotos(current:{image:string;imageBack:string;defects:string},body:Record<string,unknown>){
  const removed:{field:string;url:string}[]=[];
  for(const field of ['image','imageBack'] as const)if(field in body&&body[field]!==current[field]&&current[field])removed.push({field,url:current[field]});
  if('defects' in body&&body.defects!==current.defects){
    const parse=(value:unknown):string[]=>{try{const rows=JSON.parse(String(value||'[]'));return Array.isArray(rows)?rows.filter(row=>typeof row==='string'):[];}catch{return [];}};
    const next=new Set(parse(body.defects));
    for(const url of parse(current.defects))if(!next.has(url))removed.push({field:'defects',url});
  }
  return removed;
}
export async function preserveStockPhotos(tx:Prisma.TransactionClient,current:{id:string;name:string;image:string;imageBack:string;defects:string},body:Record<string,unknown>){
  for(const photo of removedStockPhotos(current,body))await tx.stockTrash.create({data:{kind:'photo',productId:current.id,name:current.name,snapshot:JSON.stringify(photo)}});
}
