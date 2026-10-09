import { describe, it, expect } from 'vitest';
import { checkCoverage } from './coverageChecker.js';

describe('coverageChecker service', () => {
  const mockRequirements = [
    { id: 'r1', text: 'React expertise', priority: 'must', kind: 'technical' },
    { id: 'r2', text: 'Node.js backend', priority: 'must', kind: 'technical' },
    { id: 'r3', text: 'GraphQL knowledge', priority: 'nice', kind: 'technical' }
  ];

  it('should correctly identify uncovered requirements when no questions exist', () => {
    const result = checkCoverage(mockRequirements, []);
    expect(result.must_satisfied).toBe(false);
    expect(result.uncovered_must_ids).toEqual(['r1', 'r2']);
    expect(result.uncovered_nice_ids).toEqual(['r3']);
    expect(result.uncovered_requirement_ids).toEqual(['r1', 'r2', 'r3']);
  });

  it('should return must_satisfied = true when all must requirements are covered', () => {
    const mockQuestions = [
      { id: 'q1', requirement_ids: ['r1'] },
      { id: 'q2', requirement_ids: ['r2'] }
    ];
    const result = checkCoverage(mockRequirements, mockQuestions);
    expect(result.must_satisfied).toBe(true);
    expect(result.uncovered_must_ids).toEqual([]);
    expect(result.uncovered_nice_ids).toEqual(['r3']);
  });

  it('should achieve 100% total coverage when all requirements are mapped', () => {
    const mockQuestions = [
      { id: 'q1', requirement_ids: ['r1', 'r3'] },
      { id: 'q2', requirement_ids: ['r2'] }
    ];
    const result = checkCoverage(mockRequirements, mockQuestions);
    expect(result.must_satisfied).toBe(true);
    expect(result.uncovered_requirement_ids).toEqual([]);
  });
});
