import { z } from 'zod';
import { llmClient } from '../llm/llmClient.js';
import { questionSchema } from '../validation/kitSchemas.js';
import { logger } from '../../utils/logger.js';
import { cleanRequirementText } from './stage1_requirements.js';

const questionsResponseSchema = z.object({
  questions: z.array(questionSchema)
});

/**
 * Deduplicates questions based on prompt token similarity (>=75% Jaccard overlap).
 */
export function deduplicateQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  const unique = [];
  const seenPrompts = [];

  for (const q of questions) {
    if (!q || !q.prompt) continue;
    const normPrompt = q.prompt.toLowerCase().replace(/[^a-z0-9]/g, ' ');
    const words = new Set(normPrompt.split(/\s+/).filter(w => w.length > 3));

    if (words.size === 0) {
      unique.push(q);
      continue;
    }

    let isDuplicate = false;
    for (const existingWords of seenPrompts) {
      let overlap = 0;
      for (const w of words) {
        if (existingWords.has(w)) overlap++;
      }
      const similarity = overlap / Math.max(words.size, existingWords.size, 1);
      if (similarity >= 0.75) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seenPrompts.push(words);
      unique.push(q);
    }
  }

  return unique;
}

export async function generateInitialQuestions(requirements, companyBrief = {}, roleContext = {}, qualityHints = {}) {
  const { isThinJd = false, companyResearchAvailable = true } = qualityHints;
  const roleTitle = roleContext.role_title || 'Software Engineer';
  const seniority = roleContext.seniority || 'Mid-Level';
  const isFresher = /fresher|junior|intern|entry/i.test(`${roleTitle} ${seniority}`);

  if (!requirements || requirements.length === 0) {
    const fallbackSet = fallbackQuestionGenerator([], companyBrief, roleContext, qualityHints);
    return deduplicateQuestions(fallbackSet);
  }

  const randomSubAngles = [
    'Emphasize practical execution, real-world edge cases, and domain best practices.',
    'Focus on problem-solving trade-offs, workflow efficiency, and architectural decision pitfalls.',
    'Include hands-on scenario-based troubleshooting and structural optimization challenges.'
  ];
  const selectedAngle = randomSubAngles[Math.floor(Math.random() * randomSubAngles.length)];

  const companyContext = companyResearchAvailable
    ? `Summary: ${companyBrief.summary || 'Technology company'}\nWhat They Do: ${companyBrief.what_they_do || 'Software and services engineering'}`
    : `No company research data was available. DO NOT invent company details. Company-fit questions must be generic and candidate-led (e.g. ask the candidate to research the company themselves).`;

  const thinJdNote = isThinJd
    ? `\nNOTE: This job description is very short. Generate questions strictly based on what is stated. Do not invent or assume unstated requirements, technologies, or role scope.`
    : '';

  const prompt = `You are a Principal Hiring Panel Lead creating a comprehensive, highly varied interview question bank for a candidate interviewing for:
Role: ${roleTitle} (${seniority})

REQUIREMENTS FROM JOB DESCRIPTION:
${JSON.stringify(requirements, null, 2)}

COMPANY RESEARCH (Use ONLY true facts from below; DO NOT hallucinate company details):
${companyContext}${thinJdNote}

GENERATION FOCUS FOR THIS SESSION:
${selectedAngle}

DYNAMIC TARGET DISTRIBUTIONS (Adapt based on candidate requirements and seniority; aim for roughly 20-30 total questions):
1. Technical / Core Domain (Target ~10-15 questions):
   - Must vary randomly between: conceptual, practical implementation, debugging, scenario-based, architecture, performance, and trade-offs.
2. Behavioural (Target ~5-7 questions):
   - Cover distinct soft-skills: teamwork, conflict resolution, ownership under pressure, handling failure/mistakes, continuous learning, tight deadlines, and stakeholder communication.
3. System Design / Domain Architecture (Target ~5-7 questions):
   - CRITICAL DISCIPLINE MATCHING:
     * For UI/UX / Product Designers: System Design MUST focus on Design System architecture, component tokenization, accessibility standards (WCAG AAA), responsive grid breakpoints, user flow diagrams, and design-to-code handoffs. DO NOT ask backend microservice, DB sharding, or Redis/Kafka questions for UI/UX Designers!
     * For Frontend Developers: Focus on client state management, Web Vitals performance, component breakdown, offline PWA storage, and Error Boundaries.
     * For Backend / Full-Stack / DevOps: Focus on system architecture, DB schema & query optimization, API routing, caching, and scalability appropriate for candidate seniority.
4. Company Fit (Target ~3-5 questions):
   - ${companyResearchAvailable
       ? 'Base questions strictly on the true company research provided above. Ask how candidate experience aligns with their product domain, engineering challenges, and mission. DO NOT invent fictitious products or services.'
       : 'No company data is available. Frame questions as candidate-led research tasks: e.g. "Before your interview, you will research this company. What specific aspects of their engineering stack or product would you focus on, and why?" Do NOT fabricate company details.'}

CRITICAL INSTRUCTIONS FOR GENUINE INTERVIEW QUESTIONS:
- Phrase every question like a natural, top-tier interviewer (like ChatGPT or Google hiring managers).
- NEVER repeat experience duration strings (such as "3+ years of experience in...", "5 years in...", "minimum 2 years of...") inside question prompts. Focus purely on technical depth, scenarios, trade-offs, edge cases, and architectures.
- Every question MUST reference one or more requirement IDs in "requirement_ids" (e.g. ["r1"]).
- "category" must strictly be one of: "technical", "behavioural", "system-design", "company-fit".
- "difficulty": 1 (easy), 2 (medium), 3 (hard).
- Ensure high prompt diversity and zero repetitive wording.`;

`Return JSON format:
{
  "questions": [
    {
      "id": "q1",
      "requirement_ids": ["r1"],
      "category": "technical",
      "prompt": "...",
      "answer_outline": "...",
      "difficulty": 2
    }
  ]
}`;

  try {
    const llmResult = await llmClient.generateJSON({
      prompt,
      systemInstruction: 'You are an expert hiring panel designing varied, high-signal interview questions tailored precisely to candidate discipline, role seniority, and job requirements.',
      schemaValidator: questionsResponseSchema
    });

    if (llmResult && llmResult.questions && llmResult.questions.length >= 8) {
      const formatted = llmResult.questions.map((q, idx) => {
        let cat = (q.category || 'technical').toLowerCase().trim().replace(/[\s_]+/g, '-');
        if (cat === 'systemdesign') cat = 'system-design';
        if (cat === 'companyfit') cat = 'company-fit';
        return {
          ...q,
          category: cat,
          id: q.id || `q${idx + 1}`,
          status: 'generated'
        };
      });

      const dedupped = deduplicateQuestions(formatted);
      return ensureDynamicCategoryBalance(dedupped, requirements, companyBrief, roleContext, qualityHints);
    }
  } catch (err) {
    logger.warn(`[Stage 4] LLM Question generation fallback triggered: ${err.message}`);
  }

  logger.info('[Stage 4] Using fallback question generator.');
  const fallbackSet = fallbackQuestionGenerator(requirements, companyBrief, roleContext, qualityHints);
  const dedupped2 = deduplicateQuestions(fallbackSet);
  return ensureDynamicCategoryBalance(dedupped2, requirements, companyBrief, roleContext, qualityHints);
}

export function fallbackQuestionGenerator(requirements = [], companyBrief = {}, roleContext = {}, qualityHints = {}) {
  const { companyResearchAvailable = true } = qualityHints;
  let qCount = 1;
  const questions = [];
  const roleTitle = roleContext.role_title || 'Software Engineer';
  const seniority = roleContext.seniority || 'Mid-Level';
  const isFresher = /fresher|junior|intern|entry/i.test(`${roleTitle} ${seniority}`);

  const reqList = requirements.length > 0 ? requirements : [
    { id: 'r1', text: 'Core domain skills & problem solving', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Professional execution & deliverables', kind: 'technical', priority: 'must' }
  ];

  // 1. Technical / Domain Questions
  const techSubtypes = ['conceptual', 'practical', 'debugging', 'scenario', 'performance', 'tradeoffs'];
  reqList.forEach((req, idx) => {
    const cleanText = cleanRequirementText(req.text);
    const subtype = techSubtypes[idx % techSubtypes.length];
    let promptText = '';
    let answerText = '';

    switch (subtype) {
      case 'conceptual':
        promptText = `Explain the core concepts and underlying mechanisms of ${cleanText}. How does it function in your daily workflow?`;
        answerText = `Discuss execution fundamentals, core primitives, and standard best practices for ${cleanText}.`;
        break;
      case 'practical':
        promptText = `How would you implement ${cleanText} in a production ${roleTitle} role? Walk through your execution process.`;
        answerText = `Detail structured methodology, tooling setup, quality checks, and clean deliverables for ${cleanText}.`;
        break;
      case 'debugging':
        promptText = `Suppose you encounter a critical flaw or regression related to ${cleanText}. What steps and tools do you use to diagnose and fix it?`;
        answerText = `Explain diagnostic tools, root cause analysis, isolation techniques, and prevention safeguards.`;
        break;
      case 'scenario':
        promptText = `Describe a scenario where project requirements around ${cleanText} changed late in a delivery cycle. How did you adapt?`;
        answerText = `Highlight modular design, proactive refactoring, stakeholder updates, and milestone delivery.`;
        break;
      case 'performance':
        promptText = `What are the primary bottlenecks associated with ${cleanText}, and how do you optimize them?`;
        answerText = `Cover performance metrics, asset/code optimization, caching strategies, and measurement metrics.`;
        break;
      case 'tradeoffs':
        promptText = `What technical or design trade-offs do you consider when choosing ${cleanText} over alternative approaches?`;
        answerText = `Compare complexity vs speed, maintainability, team velocity, and user experience.`;
        break;
    }

    questions.push({
      id: `q${qCount++}`,
      requirement_ids: [req.id],
      category: 'technical',
      prompt: promptText,
      answer_outline: answerText,
      difficulty: req.priority === 'must' ? 2 : 1,
      status: 'generated'
    });
  });

  // Ensure 10 Technical questions
  while (questions.filter(q => q.category === 'technical').length < 10) {
    const req = reqList[questions.length % reqList.length];
    questions.push({
      id: `q${qCount++}`,
      requirement_ids: [req.id],
      category: 'technical',
      prompt: `In a team setting, how do you enforce quality standards and peer review when working on ${req.text}?`,
      answer_outline: `Discuss review guidelines, automated verification checks, style guides, and documentation standards.`,
      difficulty: 2,
      status: 'generated'
    });
  }

  // 2. Behavioural Questions
  const primaryReqId = reqList[0]?.id || 'r1';
  const behaviouralTemplates = [
    {
      theme: 'teamwork & collaboration',
      prompt: `As a ${roleTitle}, describe a time when you collaborated with cross-functional team members to ship a key project. How did you handle trade-offs?`,
      answer: 'Use STAR method: Explain project background, your communication approach, trade-offs discussed, and on-time delivery.'
    },
    {
      theme: 'conflict & disagreement',
      prompt: 'Tell me about a technical or design disagreement you had with a teammate. How did you resolve it, and what was the outcome?',
      answer: 'Use STAR method: Detail objective data, active listening, willingness to compromise, and project success.'
    },
    {
      theme: 'ownership under pressure',
      prompt: 'Give an example of a project where you took full ownership of a deliverable despite tight deadlines or ambiguous requirements.',
      answer: 'Use STAR method: Describe initial ambiguity, proactive clarification, prioritizing core scope, and milestone delivery.'
    },
    {
      theme: 'handling failure & mistakes',
      prompt: 'Describe a mistake you made in a deliverable or design. How did you rectify it, and what processes did you put in place to prevent recurrence?',
      answer: 'Use STAR method: Detail quick response, post-mortem analysis, and automated/procedural safeguards.'
    },
    {
      theme: 'continuous learning',
      prompt: `How do you keep your skills up to date for ${roleTitle} demands? Give a recent example of a tool or methodology you mastered.`,
      answer: 'Use STAR method: Mention industry resources, personal experimentation, and applying new learnings to real problems.'
    },
    {
      theme: 'communication & deadlines',
      prompt: 'Tell me about a time you realized a project deadline was at risk. How did you communicate this to stakeholders?',
      answer: 'Use STAR method: Early escalation, presenting clear trade-off options (scope vs timeline), and delivering core value.'
    }
  ];

  behaviouralTemplates.forEach(t => {
    questions.push({
      id: `q${qCount++}`,
      requirement_ids: [primaryReqId],
      category: 'behavioural',
      prompt: t.prompt,
      answer_outline: t.answer,
      difficulty: 2,
      status: 'generated'
    });
  });

  // 3. System Design / Architecture Questions (Role & Discipline Adapted)
  reqList.forEach((req, idx) => {
    const sysPair = getRoleAdaptedSystemDesignPromptAndAnswer(req.text, roleTitle, isFresher, idx);
    questions.push({
      id: `q${qCount++}`,
      requirement_ids: [req.id],
      category: 'system-design',
      prompt: sysPair.prompt,
      answer_outline: sysPair.answer,
      difficulty: isFresher ? 2 : 3,
      status: 'generated'
    });
  });

  // Ensure minimum 5 System Design questions
  while (questions.filter(q => q.category === 'system-design').length < 5) {
    const qLen = questions.filter(q => q.category === 'system-design').length;
    const req = reqList[qLen % reqList.length];
    const sysPair = getRoleAdaptedSystemDesignPromptAndAnswer(req.text, roleTitle, isFresher, qLen);
    questions.push({
      id: `q${qCount++}`,
      requirement_ids: [req.id],
      category: 'system-design',
      prompt: sysPair.prompt,
      answer_outline: sysPair.answer,
      difficulty: isFresher ? 2 : 3,
      status: 'generated'
    });
  }

  // 4. Company Fit Questions — honest when no research available
  const primaryReqId2 = reqList[0]?.id || 'r1';
  let companyFitTemplates;
  if (!companyResearchAvailable) {
    // Generic, candidate-research-led prompts — no fabricated company specifics
    companyFitTemplates = [
      {
        prompt: `Before your interview, you would normally research this company's products, tech stack, and engineering blog. What sources do you use to understand a company's technical culture, and what would you look for specifically as a ${roleTitle}?`,
        answer: 'Look for engineering blogs, open-source repos, LinkedIn, job posts, Glassdoor, and technology stack signals. Focus on scale, challenges, and team structure.'
      },
      {
        prompt: `If no public information about a company's hiring process were available, how would you still prepare to demonstrate cultural and technical fit during the interview?`,
        answer: 'Review the job description carefully, prepare STAR stories aligned to stated requirements, and prepare thoughtful questions about team structure and tech challenges.'
      },
      {
        prompt: `What questions would you ask a hiring manager about engineering culture, team ownership models, and on-call expectations for a ${roleTitle} position?`,
        answer: 'Ask about deploy frequency, incident response, code review culture, mentorship, and how technical debt is managed.'
      }
    ];
  } else {
    const companyName = companyBrief.summary ? companyBrief.summary.split(' ')[0] : 'this company';
    const companyWhatTheyDo = companyBrief.what_they_do || 'building innovative products & services';
    companyFitTemplates = [
      {
        prompt: `What specific aspects of ${companyName}'s product focus (${companyWhatTheyDo.slice(0, 100)}) interest you most, and how does your background as a ${roleTitle} align?`,
        answer: 'Demonstrate research on company product domain, role alignment, and genuine enthusiasm for their challenges.'
      },
      {
        prompt: `How do your personal standards and workflows align with ${companyName}'s focus on quality and fast iteration?`,
        answer: 'Discuss commitment to high standards, testing/validation, iteration, and cross-team collaboration.'
      },
      {
        prompt: `When joining a team working on ${companyName}'s core platform, how do you approach getting up to speed on existing workflows?`,
        answer: 'Explain onboarding strategies, studying documentation, reviewing existing work, taking small starter tasks, and pairing with teammates.'
      },
      {
        prompt: `Where do you see your career evolving over the next 2-3 years, and how does contributing to ${companyName} as a ${roleTitle} fit into those goals?`,
        answer: 'Highlight desire for mastery, taking greater ownership responsibility, and growing alongside team impact.'
      }
    ];
  }

  companyFitTemplates.forEach(t => {
    questions.push({
      id: `q${qCount++}`,
      requirement_ids: [primaryReqId2],
      category: 'company-fit',
      prompt: t.prompt,
      answer_outline: t.answer,
      difficulty: 1,
      status: 'generated'
    });
  });

  return questions;
}

/**
 * Role-adapted System Design Prompt & Answer helper.
 */
function getRoleAdaptedSystemDesignPromptAndAnswer(reqText, roleTitle, isFresher, index = 0) {
  const isDesign = /ui|ux|design|figma|framer|product designer|graphic/i.test(roleTitle);
  const isFrontend = /frontend|react|vue|angular|ios|android|mobile|flutter|swift|kotlin/i.test(roleTitle);
  const isDataQA = /data|qa|test|automation|security|devops|cloud|sre/i.test(roleTitle);

  if (isDesign) {
    const prompts = [
      `How would you architect a unified, scalable Design System (components, tokens, accessibility standards) tailored to ${reqText}?`,
      `Walk through how you design multi-device user flows, responsive layout breakpoints, and component state variations for ${reqText}.`,
      `How do you establish a seamless Design-to-Engineering handoff workflow for ${reqText} to ensure design fidelity in production?`,
      `How would you structure usability testing, prototype validation, and design token synchronization across platforms for ${reqText}?`,
      `Explain how you design accessible, inclusive user interfaces (WCAG AAA compliance, color contrast, screen reader semantics) for ${reqText}.`
    ];
    const answers = [
      `Cover typography scales, color tokens, atomic design component hierarchy, version control in Figma, and CSS token exporting for ${reqText}.`,
      `Detail mobile-first grid systems, fluid typography, flexbox/grid layout structures, interactive state feedback, and touch target sizing for ${reqText}.`,
      `Discuss redline specs, design token documentation, interactive storybook previews, asset optimization, and developer sync meetings for ${reqText}.`,
      `Cover interactive prototyping, user task success metrics, A/B testing variations, design token CI pipelines, and cross-device QA for ${reqText}.`,
      `Explain semantic HTML layout structures, ARIA labels, focus management, color contrast ratios (4.5:1 / 7:1), and keyboard navigation for ${reqText}.`
    ];
    const idx = index % prompts.length;
    return { prompt: prompts[idx], answer: answers[idx] };
  }

  if (isFrontend) {
    const prompts = [
      `How would you architect the client-side state management, route lazy-loading, and UI rendering pipeline for ${reqText}?`,
      `Walk through your strategy for optimizing web performance (Core Web Vitals, LCP/CLS) and asset loading for ${reqText}.`,
      `How do you design a resilient offline-first or client-caching strategy (PWA / IndexedDB / Service Workers) for ${reqText}?`,
      `Explain how you structure reusable UI components, design token integration, and error boundary fallbacks for ${reqText}.`,
      `How would you handle real-time UI state updates (WebSockets / Server-Sent Events) and optimistic UI rendering for ${reqText}?`
    ];
    const answers = [
      `Discuss state colocation, context boundaries, code-splitting routes, memoization, and component lifecycle efficiency for ${reqText}.`,
      `Cover image compression, critical CSS extraction, code-splitting chunks, bundle size monitoring, and asset caching for ${reqText}.`,
      `Detail Service Worker lifecycle, cache storage strategies (Cache-First vs Network-First), IndexedDB schema, and background sync for ${reqText}.`,
      `Explain atomic component patterns, design token integration, Error Boundaries (componentDidCatch), and fallback UI skeletons for ${reqText}.`,
      `Detail optimistic UI updates, rollback mechanisms on API failure, socket reconnection loops, and UI state sync for ${reqText}.`
    ];
    const idx = index % prompts.length;
    return { prompt: prompts[idx], answer: answers[idx] };
  }

  if (isDataQA) {
    const prompts = [
      `How would you design the data/test processing architecture and validation pipeline for ${reqText}?`,
      `Walk through how you build automated, maintainable test suites and CI/CD quality gates for ${reqText}.`,
      `How do you design data monitoring, alert thresholds, and schema validation rules for ${reqText}?`,
      `Explain how you structure security threat modeling, vulnerability scanning, and compliance checks for ${reqText}.`,
      `How would you architect a scalable test data management and mock environment pipeline for ${reqText}?`
    ];
    const answers = [
      `Discuss data ingestion schemas, validation pipelines, error dead-letter queues, and output reporting for ${reqText}.`,
      `Cover Page Object Model / component testing, parallel test execution, flaky test retry policies, and CI pipeline stages for ${reqText}.`,
      `Detail schema validation (Zod/JSON Schema), metric tracking, error rate alerting, and automated rollback triggers for ${reqText}.`,
      `Explain threat modeling (STRIDE), static/dynamic code analysis (SAST/DAST), dependency auditing, and RBAC policies for ${reqText}.`,
      `Cover test data generation, database seed scripts, isolated container environments (Docker), and mock API servers for ${reqText}.`
    ];
    const idx = index % prompts.length;
    return { prompt: prompts[idx], answer: answers[idx] };
  }

  // Default Backend / Full Stack / General Software Engineering
  if (isFresher) {
    const prompts = [
      `Walk through how you would design the API endpoints, controller architecture, and database model for a feature built with ${reqText} for a ${roleTitle} role.`,
      `Describe how data flows from the client through backend controllers down to the database layer when implementing ${reqText}.`,
      `How would you structure database schemas and index key fields for ${reqText} to ensure query efficiency?`,
      `Explain how user session authentication and token authorization (JWT / Cookies) are implemented for ${reqText}.`,
      `How do you handle file uploads and static media storage for ${reqText} without exhausting server memory?`
    ];
    const answers = [
      `Explain HTTP request routing, controller validation, schema relationships, index optimization, and JSON response formatting for ${reqText}.`,
      `Discuss HTTP request lifecycle, controller validation, database queries, and structured JSON responses for ${reqText}.`,
      `Explain primary/foreign keys, document nesting vs referencing, compound indexes, and query performance metrics for ${reqText}.`,
      `Detail token payload structure, httpOnly cookies vs localStorage, token expiration, and password hashing for ${reqText}.`,
      `Discuss multipart streaming uploads, cloud object storage (S3/Cloudinary), storing file URLs in DB, and size limits for ${reqText}.`
    ];
    const idx = index % prompts.length;
    return { prompt: prompts[idx], answer: answers[idx] };
  } else {
    const prompts = [
      `How would you architect a high-availability, scalable backend system layer for ${reqText} in a ${roleTitle} application?`,
      `How would you architect an idempotent, fault-tolerant processing pipeline for ${reqText} under high concurrency?`,
      `Design a resilient database migration and caching strategy for high-traffic platforms relying on ${reqText}.`,
      `How would you architect a distributed rate-limiting gateway for APIs handling ${reqText}?`,
      `How do you design microservices for graceful degradation during partial downstream service outages for ${reqText}?`
    ];
    const answers = [
      `Discuss API gateway routing, caching layers (Redis/CDN), queueing (Kafka/RabbitMQ), DB sharding, and rate limiting for ${reqText}.`,
      `Discuss idempotency keys in headers, Redis locks, DB transaction isolations, and message queue retry queues for ${reqText}.`,
      `Explain expand-contract schema migrations, dual-writing patterns, CDN edge caching, and Redis invalidation for ${reqText}.`,
      `Compare Sliding Window vs Token Bucket algorithms using Redis, race condition prevention, and HTTP rate limit headers for ${reqText}.`,
      `Explain Circuit Breaker patterns (Resilience4j), retries with exponential backoff, and distributed tracing for ${reqText}.`
    ];
    const idx = index % prompts.length;
    return { prompt: prompts[idx], answer: answers[idx] };
  }
}

/**
 * Ensures dynamic category balance targets (Tech 10+, Behavioural 5+, System Design 5+, Company Fit 3+).
 */
export function ensureDynamicCategoryBalance(questions, requirements = [], companyBrief = {}, roleContext = {}, qualityHints = {}) {
  const { companyResearchAvailable = true } = qualityHints;
  let result = [...questions];
  const reqId = requirements[0]?.id || 'r1';
  const reqText = requirements[0]?.text || 'core system components';
  let nextId = result.length + 1;

  const behCount = result.filter(q => q.category === 'behavioural').length;
  const sysCount = result.filter(q => q.category === 'system-design').length;
  const fitCount = result.filter(q => q.category === 'company-fit').length;

  const roleTitle = roleContext.role_title || 'Software Engineer';
  const isFresher = /fresher|junior|intern|entry/i.test(`${roleTitle} ${roleContext.seniority || ''}`);

  // Fill Behavioural up to minimum 5
  if (behCount < 5) {
    const extraBeh = [
      {
        prompt: `As a ${roleTitle}, describe a scenario where you received tough feedback during a code review. How did you process it and update your work?`,
        answer: 'Focus on objectivity, growth mindset, adopting team standards, and thanking the reviewer.'
      },
      {
        prompt: 'How do you prioritize multiple competing tasks when project requirements shift mid-sprint?',
        answer: 'Explain impact vs effort evaluation, consulting project leads, updating ticket status, and maintaining focus.'
      }
    ];
    for (let i = 0; i < (5 - behCount) && i < extraBeh.length; i++) {
      result.push({
        id: `q_bal_b_${nextId++}`,
        requirement_ids: [reqId],
        category: 'behavioural',
        prompt: extraBeh[i].prompt,
        answer_outline: extraBeh[i].answer,
        difficulty: 2,
        status: 'generated'
      });
    }
  }

  // Fill System Design dynamically up to minimum 5 (Discipline adapted)
  if (sysCount < 5) {
    for (let i = 0; i < (5 - sysCount); i++) {
      const reqIdx = i % (requirements.length || 1);
      const currentReqText = requirements[reqIdx]?.text || reqText;
      const sysPair = getRoleAdaptedSystemDesignPromptAndAnswer(currentReqText, roleTitle, isFresher, sysCount + i);

      result.push({
        id: `q_bal_s_${nextId++}`,
        requirement_ids: [requirements[reqIdx]?.id || reqId],
        category: 'system-design',
        prompt: sysPair.prompt,
        answer_outline: sysPair.answer,
        difficulty: isFresher ? 2 : 3,
        status: 'generated'
      });
    }
  }

  // Fill Company Fit up to minimum 3 — honest when no company data
  if (fitCount < 3) {
    const companyFitPrompt = companyResearchAvailable
      ? `What questions do you have for our team regarding engineering culture, mentorship, and product roadmap for ${roleTitle} at ${companyBrief.summary ? companyBrief.summary.split(' ')[0] : 'our company'}?`
      : `You couldn't find much public information about this company before the interview. How would you still demonstrate genuine interest and cultural fit in the room?`;
    const companyFitAnswer = companyResearchAvailable
      ? 'Ask thoughtful questions about sprint cadence, testing culture, onboarding support, and upcoming technical initiatives.'
      : 'Lean on role alignment, transferable experience, and a prepared list of questions that show curiosity about team structure, product challenges, and engineering culture.';

    result.push({
      id: `q_bal_f_${nextId++}`,
      requirement_ids: [reqId],
      category: 'company-fit',
      prompt: companyFitPrompt,
      answer_outline: companyFitAnswer,
      difficulty: 1,
      status: 'generated'
    });
  }

  return result;
}
