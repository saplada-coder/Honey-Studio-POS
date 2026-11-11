import {dashboardDate} from './dashboard-totals';

type CalendarRental={id:string;start:string;end:string;status:string;stockReturned?:boolean};
export function rentalsForDay<T extends CalendarRental>(rentals:T[],day:string,today:string){
  return rentals.filter(r=>{
    if(r.status==='ยกเลิก')return false;
    const start=dashboardDate(r.start,today),end=dashboardDate(r.end,today);
    return !!start&&start<=day&&day<=(end&&end>=start?end:start);
  }).map(r=>({...r,event:dashboardDate(r.start,today)===day?'รับชุด':dashboardDate(r.end,today)===day?'คืนชุด':'อยู่ระหว่างเช่า'}));
}
