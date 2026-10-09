// Vector QR keeps module edges sharp at any printer resolution.
export function qrLabelPdf(id:string,modules:{size:number;get:(row:number,col:number)=>number|boolean},widthMm=58,heightMm=88){
  if(!/^[\x20-\x7e]+$/.test(id))throw new Error('รหัสชุดต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขสำหรับพิมพ์ป้าย');
  const pt=72/25.4,w=widthMm*pt,h=heightMm*pt;
  const size=Math.min(widthMm-8,heightMm-20)*pt,cell=size/(modules.size+8);
  const left=(w-size)/2,bottom=(h-size-20)/2+20;
  const n=(v:number)=>v.toFixed(4);
  const commands=['0.2 g'];
  for(let row=0;row<modules.size;row++)for(let col=0;col<modules.size;col++)if(modules.get(row,col)){
    commands.push(`${n(left+(col+4)*cell)} ${n(bottom+(modules.size+3-row)*cell)} ${n(cell)} ${n(cell)} re f`);
  }
  const font=Math.min(12,(w-8*pt)/(id.length*0.6));
  const escaped=id.replace(/([\\()])/g,'\\$1');
  commands.push(`BT /F1 ${n(font)} Tf ${n((w-id.length*font*0.6)/2)} ${n(bottom-10)} Td (${escaped}) Tj ET`);
  const stream=commands.join('\n')+'\n';
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(w)} ${n(h)}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ];
  let pdf='%PDF-1.4\n';const offsets=[0];
  objects.forEach((object,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${object}\nendobj\n`;});
  const xref=pdf.length;
  pdf+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n \n`).join('');
  pdf+=`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
