type SearchableProduct={id:string;name?:string;cat?:string;lotNumber?:string};

export function productSearch(query:string):(product:SearchableProduct)=>boolean {
  const text=query.trim().toLowerCase();
  if(!text)return ()=>true;
  const separated=text.split(/[,;，/\n\r\t]+/).map(s=>s.trim()).filter(Boolean);
  const words=text.split(/\s+/);
  const codeList=/[,;，/\n\r\t]/.test(text)?separated:words.length>1&&words.every(s=>/^[a-z0-9-]+$/.test(s)&&/\d/.test(s))?words:null;
  if(codeList){
    const codes=new Set(codeList);
    return product=>{
      const id=product.id.toLowerCase();
      return codes.has(id)||codeList.some(code=>/^\d+$/.test(code)&&id.endsWith('-'+code));
    };
  }
  return product=>[product.name,product.id,product.cat,product.lotNumber].some(value=>String(value||'').toLowerCase().includes(text));
}
