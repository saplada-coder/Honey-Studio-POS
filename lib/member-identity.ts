export function memberName(value:unknown){return String(value||'').trim().replace(/\s+/g,' ');}
export function memberPhone(value:unknown){
  let phone=String(value||'').trim().replace(/[\s()-]/g,'');
  if(phone.startsWith('+66'))phone='0'+phone.slice(3);
  else if(phone.startsWith('66')&&phone.length>=11)phone='0'+phone.slice(2);
  return /^0\d{8,9}$/.test(phone)?phone:'';
}
