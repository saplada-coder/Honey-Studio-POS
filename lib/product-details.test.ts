import { test } from 'node:test';
import assert from 'node:assert/strict';
import {rentalPrice,validateRentPrices,productMeasurements} from './product-details';
test('configured rental periods and additional days use the applicable package',()=>{
  const p={rent:300,rentPrices:JSON.stringify([{days:5,price:650},{days:3,price:450},{days:7,price:700}])};
  assert.equal(rentalPrice(p,1),300);
  assert.equal(rentalPrice(p,2),350);
  assert.equal(rentalPrice(p,3),450);
  assert.equal(rentalPrice(p,4),500);
  assert.equal(rentalPrice(p,5),650);
  assert.equal(rentalPrice(p,6),700);
  assert.equal(rentalPrice(p,7),700);
  assert.equal(rentalPrice(p,8),750);
});
test('legacy products retain their one day rental price',()=>{
  assert.equal(rentalPrice({rent:200},1),200);
  assert.equal(rentalPrice({rent:200},3),300);
  assert.equal(rentalPrice({rent:200},5),400);
});
test('rejects ambiguous, invalid and duplicate price packages',()=>{
  for(const value of ['invalid','{}','[{"days":1,"price":100}]','[{"days":3,"price":-1}]','[{"days":3.5,"price":100}]','[{"days":3,"price":100},{"days":3,"price":200}]'])assert.throws(()=>validateRentPrices(value));
  assert.equal(validateRentPrices('[{"days":5,"price":500},{"days":3,"price":300}]'),'[{"days":3,"price":300},{"days":5,"price":500}]');
});
test('labels recover exact fractional and range measurements without exposing internal notes',()=>{
  const p={chest:0,waist:26,hip:0,length:0,note:'หมายเหตุภายใน: ส่วนตัว\nอก 30–36 นิ้ว; เอว 26 นิ้ว; สะโพก 35.2 นิ้ว; ยาว 53.5 นิ้ว (135.89 ซม.)'};
  assert.deepEqual(productMeasurements(p),[['อก','30–36 นิ้ว'],['เอว','26 นิ้ว'],['สะโพก','35.2 นิ้ว'],['ความยาว','53.5 นิ้ว']]);
  assert.deepEqual(productMeasurements({}),[['อก','ไม่ระบุ'],['เอว','ไม่ระบุ'],['สะโพก','ไม่ระบุ'],['ความยาว','ไม่ระบุ']]);
});
