import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apnsOutcome, buildApnsRequest } from '../../supabase/functions/group-push/apns-contract';

test('APNs alert requests keep native token, topic and deep-link fields in the payload', () => {
  const delivery = {
    token: 'native/apns-token',
    event_id: 'event-1',
    recipient: 'user-1',
    group_code: 'QUR-1234',
    post_id: 'post-1',
    language: 'en',
  };
  const result = buildApnsRequest(delivery, {
    token: 'jwt',
    topic: 'com.Ameender.qurantracker',
    host: 'https://api.push.apple.com',
  });
  assert.equal(result.url, 'https://api.push.apple.com/3/device/native%2Fapns-token');
  assert.equal(result.headers.Authorization, 'bearer jwt');
  assert.equal(result.headers['apns-topic'], 'com.Ameender.qurantracker');
  assert.equal(result.headers['apns-push-type'], 'alert');
  assert.equal(result.body.aps.alert.title, 'New group reply');
  assert.equal(result.body.kind, 'group_reply');
  assert.equal(result.body.group_code, 'QUR-1234');
});

test('APNs outcomes retry provider failures and retire only unregistered device tokens', () => {
  assert.deepEqual(apnsOutcome(200, ''), { outcome: 'sent', reset: false });
  assert.deepEqual(apnsOutcome(410, 'Unregistered'), { outcome: 'invalid_token', reset: false });
  assert.deepEqual(apnsOutcome(503, ''), { outcome: 'retry', reset: false });
  assert.deepEqual(apnsOutcome(403, 'ExpiredProviderToken'), { outcome: 'retry', reset: true });
  assert.deepEqual(apnsOutcome(400, 'BadDeviceToken'), { outcome: 'failed', reset: false });
});
