import {test} from 'node:test';
import assert from 'node:assert/strict';
import labelSizes from './label-sizes.json';
import {productSize} from './product-size';

test('recorded sizes take priority over approximate printed labels', () => {
  const id = Object.keys(labelSizes)[0];
  assert.deepEqual(productSize({id, size: ' xs - 2xl '}), {label: 'XS - XXL', estimated: false});
});

test('missing recorded sizes use the printed label and identify it as approximate', () => {
  for (const [id, label] of Object.entries(labelSizes)) {
    assert.deepEqual(productSize({id, size: ''}), {label, estimated: true});
  }
});

test('unknown products do not inherit a made-up size', () => {
  assert.deepEqual(productSize({id: 'unlisted-product'}), {label: 'ยังไม่ระบุ', estimated: false});
});
