const {test}=require('node:test');const assert=require('node:assert/strict');const {productSearch}=require('../lib/product-search.ts');
const products=[{id:'HS-RED-013',name:'แดง 013'},{id:'HS-RED-025',name:'แดง 025'},{id:'HS-RED-013-2',name:'อีกชุด'},{id:'HS-8839',name:'แดง 01'},{id:'HS-X',name:'เดรส แขนยาว',cat:'ชุดราตรี',lotNumber:'LOT-ABC'}];
const find=q=>products.filter(productSearch(q)).map(p=>p.id);
test('multiple codes accept commas, spaces, newlines and tabs case insensitively',()=>{for(const q of ['hs-red-013, HS-RED-025','HS-RED-013 HS-RED-025','HS-RED-013\nHS-RED-025','HS-RED-013\tHS-RED-025'])assert.deepEqual(find(q),['HS-RED-013','HS-RED-025']);});
test('code lists do not include prefix collisions or duplicate results',()=>assert.deepEqual(find('HS-RED-013, HS-RED-013'),['HS-RED-013']));
test('numeric suffix lists and legacy IDs work',()=>assert.deepEqual(find('013 025 8839'),['HS-RED-013','HS-RED-025','HS-8839']));
test('ordinary single-code and phrase searches retain substring behavior',()=>{assert.deepEqual(find('เดรส แขนยาว'),['HS-X']);assert.deepEqual(find('013'),['HS-RED-013','HS-RED-013-2']);assert.deepEqual(find('lot-abc'),['HS-X']);});
test('empty query and unknown codes',()=>{assert.equal(find('').length,products.length);assert.deepEqual(find('HS-RED-999, HS-NONE-000'),[]);});
test('trailing list separators are ignored',()=>assert.deepEqual(find('HS-RED-013,'),['HS-RED-013']));
