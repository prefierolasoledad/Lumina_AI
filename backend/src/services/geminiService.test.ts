import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRetryableError } from './geminiService.js';

// These tests document the retry policy: transient/overload errors should be
// retried (up to 3 times), while bad-request / auth errors must fail fast.
test('transient errors are retryable', () => {
  assert.equal(isRetryableError(new Error('503 Service Unavailable')), true);
  assert.equal(isRetryableError(new Error('The model is overloaded')), true);
  assert.equal(isRetryableError(new Error('429 rate limit exceeded')), true);
  assert.equal(isRetryableError(new Error('500 internal error')), true);
  assert.equal(isRetryableError(new Error('fetch failed')), true);
});

test('non-transient errors fail fast (not retryable)', () => {
  assert.equal(isRetryableError(new Error('400 bad request')), false);
  assert.equal(isRetryableError(new Error('401 Unauthorized')), false);
  assert.equal(isRetryableError(new Error('API Key is missing')), false);
});

test('handles non-Error inputs without throwing', () => {
  assert.equal(isRetryableError(null), false);
  assert.equal(isRetryableError('overloaded'), true);
});
