export function normalizeImportedProduct(body:Record<string,any>,existingImported=false){
  if('importedAustralia' in body&&typeof body.importedAustralia!=='boolean')throw new Error('ข้อมูลสินค้านำเข้าต้องเป็นใช่หรือไม่ใช่');
  for(const key of ['cost','sell'])if(key in body&&(!Number.isSafeInteger(body[key])||body[key]<0||body[key]>2147483647))throw new Error('ราคาทุนและราคาขายต้องเป็นจำนวนเต็มตั้งแต่ 0 บาท');
  if(body.importedAustralia??existingImported)body.type='ขาย';
  return body;
}
