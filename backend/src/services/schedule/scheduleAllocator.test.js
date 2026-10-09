import { describe, it, expect } from 'vitest';
import { allocateSchedule } from './scheduleAllocator.js';

describe('scheduleAllocator service', () => {
  const mockRequirements = [
    { id: 'r1', priority: 'must' },
    { id: 'r2', priority: 'nice' }
  ];

  const mockQuestions = [
    { id: 'q1', requirement_ids: ['r1'], difficulty: 3, category: 'technical' },
    { id: 'q2', requirement_ids: ['r2'], difficulty: 1, category: 'behavioural' },
    { id: 'q3', requirement_ids: ['r1'], difficulty: 2, category: 'system-design' }
  ];

  it('should allocate exact requested number of days (e.g. 5 days)', () => {
    const result = allocateSchedule(mockQuestions, mockRequirements, 5);
    expect(result.days_available).toBe(5);
    expect(result.days.length).toBe(5);
  });

  it('should allocate exact requested number of days for long timelines (e.g. 60 days)', () => {
    const result = allocateSchedule(mockQuestions, mockRequirements, 60);
    expect(result.days_available).toBe(60);
    expect(result.days.length).toBe(60);
  });

  it('should compute integer minutes for each day based on difficulty', () => {
    const result = allocateSchedule(mockQuestions, mockRequirements, 3);
    result.days.forEach(day => {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThan(0);
    });
  });

  it('should place higher priority / harder questions earlier in schedule', () => {
    const result = allocateSchedule(mockQuestions, mockRequirements, 3);
    // q1 has priority must + diff 3, should be assigned on Day 1
    expect(result.days[0].question_ids).toContain('q1');
  });
});
