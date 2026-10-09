import { describe, it, expect } from 'vitest';
import { repairJson } from './jsonRepair.js';

describe('repairJson utility', () => {
  it('should parse valid JSON without modifications', () => {
    const input = '{"foo": "bar", "num": 123}';
    expect(repairJson(input)).toEqual({ foo: 'bar', num: 123 });
  });

  it('should extract JSON wrapped in markdown code blocks', () => {
    const input = '```json\n{"status": "ok"}\n```';
    expect(repairJson(input)).toEqual({ status: 'ok' });
  });

  it('should repair trailing commas inside JSON objects and arrays', () => {
    const input = '{"items": [1, 2, 3,], "valid": true,}';
    expect(repairJson(input)).toEqual({ items: [1, 2, 3], valid: true });
  });

  it('should auto-close unclosed brackets and quotes on truncated JSON', () => {
    const input = '{"questions": [{"id": "q1", "prompt": "Unfinished question';
    const result = repairJson(input);
    expect(result).toBeDefined();
    expect(result.questions[0].id).toBe('q1');
  });
});
