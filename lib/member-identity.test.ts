import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memberName,memberPhone} from './member-identity';
test('phone formats identify the same Thai member',()=>{assert.equal(memberPhone('081-234-5678'),'0812345678');assert.equal(memberPhone('+66 81 234 5678'),'0812345678');assert.equal(memberPhone('66812345678'),'0812345678');});
test('invalid and incomplete phones are rejected',()=>{for(const phone of ['123','081abc5678','081234567890','+9981234567'])assert.equal(memberPhone(phone),'');});
test('member names ignore redundant whitespace without matching different people',()=>{assert.equal(memberName('  สมใจ   ใจดี '),'สมใจ ใจดี');assert.notEqual(memberName('สมใจ ใจดี'),memberName('สมหญิง ใจดี'));});
