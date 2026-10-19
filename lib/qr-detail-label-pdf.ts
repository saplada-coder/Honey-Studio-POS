import PDFDocument from 'pdfkit';
import path from 'node:path';
import {productMeasurements} from './product-details';
import {productSize} from './product-size';

export type DetailLabelProduct={id:string;name:string;size?:string;chest?:number;waist?:number;hip?:number;length?:number;note?:string};
type Modules={size:number;get:(row:number,col:number)=>number|boolean};

export function labelDetails(product:DetailLabelProduct){
  const split=product.name.indexOf(' ซ้ำ');
  const name=split<0?product.name:product.name.slice(0,split);
  const subtitle=split<0?'':product.name.slice(split).trim();
  const measurements=productMeasurements(product);
  const dimensions=measurements.slice(0,3).map(([label,value])=>`${label} ${value.replace(/ นิ้ว$/,'')}`).join(' · ');
  const length=measurements[3][1];
  const numeric=/^(\d+(?:\.\d+)?) นิ้ว$/.exec(length);
  const lengthText=`ยาว ${length}`+(numeric?` / ${Number((Number(numeric[1])*2.54).toFixed(2))} ซม.`:'');
  return {name,subtitle,size:productSize(product).label,dimensions,lengthText};
}

// Embed Thai fonts; keep QR modules as vectors with a four-module quiet zone.
export async function qrDetailLabelsPdf(labels:{product:DetailLabelProduct;modules:Modules}[],widthMm=50,heightMm=70):Promise<Uint8Array<ArrayBuffer>>{
  if(!labels.length||labels.length>500)throw new Error('เลือก 1–500 ชุดต่อไฟล์');
  if(!Number.isFinite(widthMm)||!Number.isFinite(heightMm)||widthMm<50||heightMm<50||widthMm>150||heightMm>200)throw new Error('ขนาดป้ายไม่ถูกต้อง');
  const regular=path.join(process.cwd(),'public/fonts/Sarabun-Regular.ttf');
  const bold=path.join(process.cwd(),'public/fonts/Sarabun-Bold.ttf');
  const width=widthMm*72/25.4,height=heightMm*72/25.4;
  const doc=new PDFDocument({autoFirstPage:false,margin:0,font:regular,info:{Title:'HONEY STUDIO QR Labels'}});
  const chunks:Buffer[]=[];
  const done=new Promise<Uint8Array<ArrayBuffer>>((resolve,reject)=>{doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(new Uint8Array(Buffer.concat(chunks))));doc.on('error',reject);});
  doc.registerFont('Thai',regular);doc.registerFont('ThaiBold',bold);
  for(const {product,modules} of labels){
    const details=labelDetails(product);
    doc.addPage({size:[width,height],margin:0});
    const scale=Math.min(width/600,height/840);
    doc.save().translate((width-600*scale)/2,(height-840*scale)/2).scale(scale);
    const centered=(text:string,y:number,fontSize:number,font='Thai',available=490)=>{
      doc.save().scale(1/scale);
      doc.font(font).fontSize(fontSize*scale);
      const measured=doc.widthOfString(text);
      if(measured>available*scale)doc.fontSize(fontSize*scale*available*scale/measured);
      doc.fillColor('#111').text(text,(600-available)/2*scale,y*scale,{width:available*scale,align:'center',lineBreak:false});
      doc.restore();
    };
    centered('HONEY STUDIO',28,32,'Times-Roman');
    doc.strokeColor('#777').lineWidth(1).moveTo(55,88).lineTo(545,88).stroke();
    centered(details.name,102,34,'ThaiBold');
    centered(details.subtitle,157,22);
    doc.strokeColor('#111').lineWidth(2).roundedRect(225,205,150,68,8).stroke();
    centered(details.size,214,40,'ThaiBold',130);
    centered(details.dimensions,292,27);
    centered(details.lengthText,337,26);
    centered('สัดส่วนรอบตัว หน่วยนิ้ว',377,18);
    const cell=340/(modules.size+8),left=130,top=405;
    doc.fillColor('#000');
    for(let row=0;row<modules.size;row++)for(let col=0;col<modules.size;col++)if(modules.get(row,col))doc.rect(left+(col+4)*cell,top+(row+4)*cell,cell,cell).fill();
    centered(product.id,749,27,'Courier');
    centered('สแกนดูข้อมูลชุด',789,20);
    doc.restore();
  }
  doc.end();
  return done;
}
