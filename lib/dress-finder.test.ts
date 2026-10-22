import test from 'node:test';
import assert from 'node:assert/strict';
import {parseDressRequest,matchesDress,emptyDressCriteria} from './dress-finder';
test('Thai speech extracts color, size, stock and measurements',()=>{
 const {criteria:c}=parseDressRequest('ขอชุดสีเขียว ไซส์เอ็ม พร้อมเช่า อก 34 เอว 28');
 assert.equal(c.color,'เขียว');assert.equal(c.size,'M');assert.equal(c.available,true);assert.equal(c.chest,34);assert.equal(c.waist,28);
});
test('size tokens do not confuse XL with L; navy differs from sky',()=>{
 assert.equal(parseDressRequest('สีฟ้า XL').criteria.size,'XL');assert.equal(parseDressRequest('สีน้ำเงิน').criteria.color,'น้ำเงิน');
 assert.equal(matchesDress({size:'XL',color:'ฟ้า'},{...emptyDressCriteria,size:'L'}),false);
});
test('unknown measurements and reserved stock cannot claim a match',()=>{
 assert.equal(matchesDress({chest:0},{...emptyDressCriteria,chest:32}),false);
 assert.equal(matchesDress({stockRent:1,status:'ถูกจอง'},{...emptyDressCriteria,available:true}),false);
});
test('pastel needs evidence; size ranges include S',()=>{
 assert.equal(matchesDress({color:'เขียว'},{...emptyDressCriteria,tone:'pastel'}),false);
 assert.equal(matchesDress({color:'เขียวอ่อน',size:'XS-S'},{...emptyDressCriteria,tone:'pastel',size:'S'}),true);
 assert.equal(parseDressRequest('สวัสดี').recognized,false);
});
