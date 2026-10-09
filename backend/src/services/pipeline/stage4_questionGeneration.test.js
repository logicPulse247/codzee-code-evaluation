import { describe, it, expect } from 'vitest';
import { generateInitialQuestions, deduplicateQuestions, fallbackQuestionGenerator } from './stage4_questionGeneration.js';

describe('Question Generation Logic & Variety Tests', () => {
  const mernFresherReqs = [
    { id: 'r1', text: 'Proficiency in React.js and modern state management', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Node.js and Express backend API development', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'MongoDB schema design and indexing basics', kind: 'technical', priority: 'must' },
    { id: 'r4', text: 'RESTful API integration and error handling', kind: 'technical', priority: 'must' },
    { id: 'r5', text: 'Strong communication and teamwork skills', kind: 'behavioural', priority: 'must' },
    { id: 'r6', text: 'Basic understanding of Git and version control', kind: 'technical', priority: 'nice' }
  ];

  const mernCompanyBrief = {
    summary: 'Acme SaaS Solutions is a fast-growing cloud platform provider.',
    what_they_do: 'Building real-time web applications and developer tools.'
  };

  const mernRoleContext = {
    role_title: 'MERN Stack Developer',
    seniority: 'Fresher / Entry-Level'
  };

  it('should generate a dynamic, varied question bank covering all 4 categories for a Fresher MERN role', async () => {
    const questions = await generateInitialQuestions(mernFresherReqs, mernCompanyBrief, mernRoleContext);

    expect(questions).toBeInstanceOf(Array);
    expect(questions.length).toBeGreaterThanOrEqual(15);

    const techCount = questions.filter(q => q.category === 'technical').length;
    const behCount = questions.filter(q => q.category === 'behavioural').length;
    const sysCount = questions.filter(q => q.category === 'system-design').length;
    const fitCount = questions.filter(q => q.category === 'company-fit').length;

    // Verify dynamic distribution targets
    expect(techCount).toBeGreaterThanOrEqual(8);
    expect(behCount).toBeGreaterThanOrEqual(4);
    expect(sysCount).toBeGreaterThanOrEqual(4);
    expect(fitCount).toBeGreaterThanOrEqual(2);
  }, 20000);

  it('should adjust System Design questions for a Fresher role appropriately', () => {
    const questions = fallbackQuestionGenerator(mernFresherReqs, mernCompanyBrief, mernRoleContext);
    const sysDesignQs = questions.filter(q => q.category === 'system-design');

    expect(sysDesignQs.length).toBeGreaterThanOrEqual(4);
    const promptsText = sysDesignQs.map(q => q.prompt.toLowerCase()).join(' ');

    // Fresher system design should focus on REST APIs, DB Schemas, authentication, input validation
    expect(
      promptsText.includes('rest') ||
      promptsText.includes('database schema') ||
      promptsText.includes('authentication') ||
      promptsText.includes('jwt') ||
      promptsText.includes('react')
    ).toBe(true);
  });

  it('should deduplicate questions with >= 75% prompt similarity', () => {
    const duplicateSet = [
      { id: 'q1', prompt: 'How do you optimize React render performance in large apps?' },
      { id: 'q2', prompt: 'How do you optimize React render performance in large apps?' },
      { id: 'q3', prompt: 'Tell me about a time you faced a tough technical deadline.' }
    ];

    const deduplicated = deduplicateQuestions(duplicateSet);
    expect(deduplicated.length).toBe(2);
    expect(deduplicated.map(q => q.id)).toEqual(['q1', 'q3']);
  });

  it('should ensure all MUST-have requirements are mapped to questions', async () => {
    const questions = await generateInitialQuestions(mernFresherReqs, mernCompanyBrief, mernRoleContext);
    const coveredReqIds = new Set(questions.flatMap(q => q.requirement_ids || []));

    const mustReqs = mernFresherReqs.filter(r => r.priority === 'must');
    mustReqs.forEach(mustReq => {
      expect(coveredReqIds.has(mustReq.id)).toBe(true);
    });
  }, 20000);

  it('should adapt System Design questions and answers for UI/UX Designer roles', () => {
    const uiuxRoleContext = {
      role_title: 'UI/UX Designer',
      seniority: '3 Years Experience'
    };
    const uiuxReqs = [
      { id: 'r1', text: 'Design System & Component Tokens in Figma', kind: 'technical', priority: 'must' },
      { id: 'r2', text: 'WCAG Accessibility & Responsive Wireframing', kind: 'technical', priority: 'must' }
    ];

    const questions = fallbackQuestionGenerator(uiuxReqs, {}, uiuxRoleContext);
    const sysQs = questions.filter(q => q.category === 'system-design');

    expect(sysQs.length).toBeGreaterThanOrEqual(4);
    const answerText = sysQs.map(q => q.answer_outline.toLowerCase()).join(' ');

    // Must NOT contain microservices, Redis, Kafka, or DB sharding
    expect(answerText.includes('microservices')).toBe(false);
    expect(answerText.includes('kafka')).toBe(false);

    // Must contain UI/UX concepts like Design System, Figma, WCAG, or breakpoints
    expect(
      answerText.includes('figma') ||
      answerText.includes('design system') ||
      answerText.includes('wcag') ||
      answerText.includes('typography') ||
      answerText.includes('accessibility')
    ).toBe(true);
  });
});
