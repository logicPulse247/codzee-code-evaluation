import { describe, it, expect, vi } from 'vitest';
import { kitsService } from './kits.service.js';

describe('kitsService - Preservation of Edited Questions during Regeneration', () => {
  it('should preserve edited questions with status=edited or is_edited=true when category is regenerated', async () => {
    const mockKit = {
      _id: 'kit_123',
      userId: 'user_123',
      role: {
        requirements: [{ id: 'req_1', text: 'React', kind: 'technical', priority: 'must' }]
      },
      company_brief: { summary: 'Test Co' },
      schedule: { days_available: 5 },
      coverage: { passes: 1, uncovered_requirement_ids: [] },
      questions: [
        {
          id: 'q_edited_1',
          prompt: 'My Custom Edited React Question',
          answer_outline: ['Custom point 1', 'Custom point 2'],
          category: 'technical',
          status: 'edited',
          is_edited: true,
          difficulty: 3
        },
        {
          id: 'q_gen_1',
          prompt: 'Generic Generated Question',
          answer_outline: 'Generic answer',
          category: 'technical',
          status: 'generated',
          is_edited: false,
          difficulty: 2
        },
        {
          id: 'q_beh_1',
          prompt: 'Behavioral question in other category',
          answer_outline: 'Other category answer',
          category: 'behavioural',
          status: 'generated',
          is_edited: false,
          difficulty: 2
        }
      ],
      flashcards: [],
      save: vi.fn().mockResolvedValue(true)
    };

    vi.spyOn(kitsService, 'getKitById').mockResolvedValue(mockKit);

    const updatedKit = await kitsService.regenerateSection('kit_123', 'user_123', {
      targetSection: 'category',
      category: 'technical',
      questions: mockKit.questions
    });

    const technicalQuestions = updatedKit.questions.filter(q => q.category === 'technical');
    const editedQuestion = technicalQuestions.find(q => q.id === 'q_edited_1');

    expect(editedQuestion).toBeDefined();
    expect(editedQuestion.prompt).toBe('My Custom Edited React Question');
    expect(editedQuestion.status).toBe('edited');

    // The unedited generated question q_gen_1 in technical category should be replaced with new generated questions
    const uneditedOldQuestion = technicalQuestions.find(q => q.id === 'q_gen_1');
    expect(uneditedOldQuestion).toBeUndefined();

    // Questions in other categories should remain untouched
    const behavioralQuestions = updatedKit.questions.filter(q => q.category === 'behavioural');
    expect(behavioralQuestions.length).toBe(1);
    expect(behavioralQuestions[0].id).toBe('q_beh_1');
  });
});
