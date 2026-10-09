export function normalizeImportedProduct(body:Record<string,any>,existingImported=false,existingDates:{manufactureDate?:string;expiryDate?:string}={}){
  if('importedAustralia' in body&&typeof body.importedAustralia!=='boolean')throw new Error('ข้อมูลสินค้านำเข้าต้องเป็นใช่หรือไม่ใช่');
  for(const key of ['cost','sell'])if(key in body&&(!Number.isSafeInteger(body[key])||body[key]<0||body[key]>2147483647))throw new Error('ราคาทุนและราคาขายต้องเป็นจำนวนเต็มตั้งแต่ 0 บาท');
  if(body.importedAustralia??existingImported)body.type='ขาย';
  if('minStock' in body&&(!Number.isSafeInteger(body.minStock)||body.minStock<0||body.minStock>2147483647))throw new Error('สต็อกขั้นต่ำต้องเป็นจำนวนเต็มตั้งแต่ 0');
  for(const key of ['packageSize','unit','lotNumber'])if(key in body){
    if(typeof body[key]!=='string'||body[key].length>200)throw new Error('ขนาด หน่วยนับ และหมายเลขล็อตต้องไม่เกิน 200 ตัวอักษร');
    body[key]=body[key].trim();
  }
  for(const key of ['manufactureDate','expiryDate'])if(key in body&&body[key]!==''){
    const value=body[key];
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new Error('วันที่ผลิตและวันหมดอายุต้องเป็นวันที่ถูกต้อง');
  }
  const manufactureDate=body.manufactureDate??existingDates.manufactureDate,expiryDate=body.expiryDate??existingDates.expiryDate;
  if(manufactureDate&&expiryDate&&expiryDate<manufactureDate)throw new Error('วันหมดอายุต้องไม่อยู่ก่อนวันที่ผลิต');
  return body;
}
