import {isDate,thaiToday} from './booking-availability';
export function promotionStatus(start:string,end:string,today=thaiToday()){
  if(!isDate(start)||!isDate(end)||end<start)return 'announced';
  return today<start?'upcoming':today>end?'ended':'active';
}
