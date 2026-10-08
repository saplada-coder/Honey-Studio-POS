import {test} from 'node:test';
import assert from 'node:assert/strict';
import {promotionStatus} from './promotion-period';
test('October campaign includes both endpoints and does not start before October 9',()=>{assert.equal(promotionStatus('2026-10-09','2026-10-30','2026-10-08'),'upcoming');assert.equal(promotionStatus('2026-10-09','2026-10-30','2026-10-09'),'active');assert.equal(promotionStatus('2026-10-09','2026-10-30','2026-10-30'),'active');assert.equal(promotionStatus('2026-10-09','2026-10-30','2026-10-31'),'ended');});
