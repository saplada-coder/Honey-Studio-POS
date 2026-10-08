import { prisma } from './prisma';
import { productMeasurements, rentalPrice } from './product-details';
export const staffRoles=['เจ้าของ','ผู้ดูแลระบบ','พนักงานขาย'];
export type ShopInfo={intro:string;phone:string;line:string;map:string;address:string;social:string;bank:string;accountName:string;account:string;promotions:string};
export const defaultShopInfo:ShopInfo={intro:'เลือกชุดสำหรับวันสำคัญของคุณ พร้อมรายละเอียดขนาดและราคาเช่า',phone:'',line:'',map:'',address:'',social:'',bank:'',accountName:'',account:'',promotions:''};
export async function shopInfo():Promise<ShopInfo>{const setting=await prisma.shopSettings.findUnique({where:{id:'main'}});try{return {...defaultShopInfo,...JSON.parse(setting?.data||'{}')};}catch{return defaultShopInfo;}}
export async function shopProducts(){
  const products=await prisma.product.findMany({where:{type:{in:['เช่า','ทั้งคู่']},status:{not:'ปลดสต็อก'}},orderBy:{name:'asc'}});
  return products.map(p=>({id:p.id,name:p.name,cat:p.cat,color:p.color.trim(),size:p.size,image:p.image,imageBack:p.imageBack,rent:p.rent,rentPrices:p.rentPrices,specs:productMeasurements(p),status:p.status,available:p.stockRent>0&&!['ซัก','ซ่อม'].includes(p.status),prices:[1,3,5].map(days=>({days,price:rentalPrice(p,days)}))}));
}
