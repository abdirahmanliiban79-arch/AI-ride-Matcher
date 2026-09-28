import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseTypeSafeDecision } from '../../src/services/typesafe/decisionParser';
import { AppError } from '../../src/utils/AppError';

const GOOD = '{"selectedDriverId":"driver-a","matchType":"best_match","confidence":0.92}';

function expectInvalid(label: string, content: string): void {
  assert.throws(
    () => parseTypeSafeDecision(content),
    (error: unknown) =>
      error instanceof AppError &&
      error.statusCode === 502 &&
      error.code === 'AI_INVALID_RESPONSE',
    label,
  );
}

describe('TypeSafe decision parsing (AI boundary)', () => {
  it('parses plain, fenced and prose-wrapped JSON', () => {
    assert.equal(parseTypeSafeDecision(GOOD).selectedDriverId, 'driver-a');
    assert.equal(
      parseTypeSafeDecision(`\`\`\`json\n${GOOD}\n\`\`\``).selectedDriverId,
      'driver-a',
    );
    assert.equal(
      parseTypeSafeDecision(`Here is my decision:\n${GOOD}\nHope that helps.`).matchType,
      'best_match',
    );
  });

  it('accepts human_review and no_match within the contract', () => {
    const humanReview = parseTypeSafeDecision(
      '{"selectedDriverId":"d","matchType":"human_review","confidence":0.4}',
    );
    const noMatch = parseTypeSafeDecision(
      '{"selectedDriverId":"d","matchType":"no_match","confidence":0}',
    );

    assert.equal(humanReview.matchType, 'human_review');
    assert.equal(noMatch.matchType, 'no_match');
    assert.equal(noMatch.confidence, 0);
  });

  it('strips extra fields from the decision', () => {
    const decision = parseTypeSafeDecision(
      '{"selectedDriverId":"d","matchType":"best_match","confidence":0.8,"reason":"closest"}',
    );

    assert.deepEqual(decision, {
      selectedDriverId: 'd',
      matchType: 'best_match',
      confidence: 0.8,
    });
  });

  it('rejects invalid confidence values', () => {
    expectInvalid('above 1', '{"selectedDriverId":"d","matchType":"best_match","confidence":1.5}');
    expectInvalid('negative', '{"selectedDriverId":"d","matchType":"best_match","confidence":-0.1}');
    expectInvalid('string', '{"selectedDriverId":"d","matchType":"best_match","confidence":"0.9"}');
  });

  it('rejects malformed decisions and non-JSON output', () => {
    expectInvalid('unknown matchType', '{"selectedDriverId":"d","matchType":"maybe","confidence":0.9}');
    expectInvalid('missing driverId', '{"matchType":"best_match","confidence":0.9}');
    expectInvalid('empty driverId', '{"selectedDriverId":"","matchType":"best_match","confidence":0.9}');
    expectInvalid('plain text', 'I choose driver-a');
    expectInvalid('empty response', '   ');
    expectInvalid('array response', '[{"selectedDriverId":"d"}]');
    expectInvalid('null response', 'null');
  });
});