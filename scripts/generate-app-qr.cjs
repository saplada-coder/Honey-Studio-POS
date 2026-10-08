const QRCode=require('qrcode');
const fs=require('node:fs');
const path=require('node:path');
const url='https://honey-studio-opal.vercel.app/';
async function main(){
  const options={width:1200,margin:4,errorCorrectionLevel:'M',color:{dark:'#000000',light:'#FFFFFF'}};
  await QRCode.toFile(path.join(__dirname,'../public/qr-app.png'),url,options);
  const svg=await QRCode.toString(url,{...options,type:'svg'});
  fs.writeFileSync(path.join(__dirname,'../public/qr-app.svg'),svg);
  console.log('Created app QR: '+url);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
