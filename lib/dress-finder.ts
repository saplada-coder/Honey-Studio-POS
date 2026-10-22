export type DressCriteria={size:string;color:string;tone:string;length:string;available:boolean;chest:number;waist:number;hip:number};
export const emptyDressCriteria: DressCriteria={size:'',color:'',tone:'',length:'',available:false,chest:0,waist:0,hip:0};
export const toneColors:Record<string,string[]>={pastel:['ชมพู','ฟ้า','ม่วง','เขียว','เหลือง'],warm:['แดง','ส้ม','เหลือง','ทอง','น้ำตาล','นู้ด','ครีม'],cool:['เขียว','ฟ้า','น้ำเงิน','ม่วง'],neutral:['ขาว','ดำ','เทา','ครีม','นู้ด','น้ำตาล']};
export function parseDressRequest(text:string):{criteria:DressCriteria;recognized:boolean}{
 const t=text.toLowerCase();const criteria={...emptyDressCriteria};let recognized=false;
 const colors=['น้ำเงิน','เขียว','ชมพู','ม่วง','แดง','ส้ม','เหลือง','ทอง','น้ำตาล','นู้ด','ครีม','ขาว','ดำ','เทา','ฟ้า'];
 criteria.color=colors.find(c=>t.includes(c))||'';
 const sizes:[string,RegExp][]=[['XXL',/\bxxl\b|สองเอ็กซ์แอล|ดับเบิลเอ็กซ์แอล/],['XL',/\bxl\b|เอ็กซ์แอล/],['XS',/\bxs\b|เอ็กซ์เอส/],['S',/\bs\b|(?:ไซ[สซส์]*|ขนาด)\s*เอส/],['M',/\bm\b|(?:ไซ[สซส์]*|ขนาด)\s*(?:เอ็ม|เอม)/],['L',/\bl\b|(?:ไซ[สซส์]*|ขนาด)\s*แอล/]];
 criteria.size=sizes.find(([,re])=>re.test(t))?.[0]||'';
 criteria.tone=/พาสเทล|pastel/.test(t)?'pastel':/โทนร้อน|โทนอุ่น/.test(t)?'warm':/โทนเย็น/.test(t)?'cool':/โทนกลาง|เอิร์ธโทน/.test(t)?'neutral':'';
 criteria.length=/เดรสสั้น|ชุดสั้น/.test(t)?'short':/เดรสยาว|ชุดยาว/.test(t)?'long':'';
 criteria.available=/พร้อมเช่า|ว่าง|มีของ/.test(t);
 for(const [key,label] of [['chest','อก'],['waist','เอว'],['hip','สะโพก']] as const){const m=t.match(new RegExp(label+'\\s*(\\d+(?:\\.\\d+)?)'));if(m)criteria[key]=Number(m[1]);}
 recognized=Object.values(criteria).some(Boolean);return {criteria,recognized};
}
type Dress={size?:string;color?:string;name?:string;chest?:number;waist?:number;hip?:number;stockRent?:number;status?:string};
export function matchesDress(p:Dress,c:DressCriteria){
 const color=String(p.color||'');const name=String(p.name||'');
 if(c.size&&!String(p.size||'').toUpperCase().split(/[-/\s]+/).includes(c.size))return false;
 if(c.color&&!color.includes(c.color)&&!name.includes('สี'+c.color))return false;
 if(c.tone==='pastel'&&!/พาสเทล|อ่อน|pastel/i.test(color+' '+name))return false;
 if(c.tone&&c.tone!=='pastel'&&!toneColors[c.tone]?.some(v=>color.includes(v)))return false;
 if(c.length==='short'&&!/เดรสสั้น|ชุดสั้น/.test(name))return false;
 if(c.length==='long'&&!/เดรสยาว|ชุดยาว/.test(name))return false;
 if(c.available&&(!(Number(p.stockRent)>0)||!['ว่าง','พร้อมเช่า'].includes(p.status||'')))return false;
 for(const key of ['chest','waist','hip'] as const)if(c[key]&&(!p[key]||Number(p[key])<c[key]))return false;
 return true;
}
