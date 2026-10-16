type PaidRental={id:string;cust:string;item:string;fee:number;fine:number;damage:number;paymentStatus:string;paymentSlip:string;createdAt:Date|string};
type ExistingTransaction={id:string;desc:string;type?:string};
export const rentalIncomePrefix='AUTO-RENTAL:';
export function rentalIncome(rentals:PaidRental[],existing:ExistingTransaction[]=[]){
  return rentals.filter(r=>r.paymentStatus==='ชำระแล้ว').flatMap(r=>{
    const id=rentalIncomePrefix+r.id;
    // An existing receipt explicitly referencing this rental already represents its income.
    if(existing.some(t=>t.id===id||t.type==='in'&&String(t.desc||'').split(/[\s·,;()]+/).includes(r.id)))return [];
    const amount=r.fee+r.fine+r.damage;
    if(!Number.isSafeInteger(amount)||amount<=0)return [];
    const createdAt=new Date(r.createdAt);
    const date=new Date(createdAt.getTime()+7*3600000).toISOString().slice(0,10);
    return [{id,date,desc:`ค่าเช่า ${r.id} · ${r.cust} · ${r.item}`,cat:'รายรับ-เช่า',type:'in',amt:amount,auto:true,sourceRentalId:r.id,
      payer:'',sender:'',payee:'',account:'',advance:false,transferred:false,slipsAdvance:'',slipsTransfer:'',slips:r.paymentSlip?JSON.stringify([r.paymentSlip]):'',createdAt:createdAt.toISOString()}];
  });
}
