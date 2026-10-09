import { z } from 'zod';

export const requirementSchema = z.object({
  id: z.string(),
  text: z.string(),
  kind: z.enum(['technical', 'behavioural', 'domain']),
  priority: z.enum(['must', 'nice'])
});

export const questionSchema = z.object({
  id: z.string(),
  requirement_ids: z.array(z.string()),
  category: z.enum(['technical', 'behavioural', 'system-design', 'company-fit']),
  prompt: z.string(),
  answer_outline: z.union([z.string(), z.array(z.string())]).default(''),
  difficulty: z.number().int().min(1).max(5),
  status: z.enum(['generated', 'edited', 'pinned']).default('generated'),
  is_edited: z.boolean().optional().default(false)
});

export const flashcardSchema = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string(),
  requirement_ids: z.array(z.string()),
  status: z.enum(['generated', 'edited', 'pinned']).default('generated')
});

export const dayScheduleSchema = z.object({
  day: z.number().int().min(1),
  focus: z.string(),
  question_ids: z.array(z.string()),
  minutes: z.number().int().nonnegative()
});

export const researchSchema = z.object({
  crawled_pages: z
    .array(z.object({ url: z.string(), title: z.string().default('') }))
    .default([]),
  skipped_pages: z
    .array(
      z.object({
        url: z.string(),
        reason: z.string().default(''),
        status: z.number().default(0)
      })
    )
    .default([]),
  process_steps: z
    .array(
      z.object({
        round_name: z.string(),
        description: z.string().default('')
      })
    )
    .default([]),
  insights: z.array(z.string()).default([]),
  public_sources: z
    .array(
      z.object({
        url: z.string(),
        title: z.string().default(''),
        source_type: z.string().default('public')
      })
    )
    .default([]),
  interview_summary: z.string().default('')
});

export const kitSchema = z.object({
  research: researchSchema.default({}),
  source: z.object({
    company: z.string().default(''),
    company_url: z.string().default(''),
    role: z.string().default(''),
    location: z.string().default(''),
    jd_chars: z.number().int().nonnegative().default(0),
    is_thin_jd: z.boolean().default(false),
    is_invalid_jd: z.boolean().default(false),
    jd_quality_note: z.string().optional().default(''),
    data_quality: z.enum(['full', 'partial', 'thin', 'none']).default('full'),
    researched_at: z.string().default(''),
    pages_used: z.array(z.string()).default([])
  }),
  company_brief: z.object({
    summary: z.string().default(''),
    what_they_do: z.string().default(''),
    sources: z.array(z.string()).default([]),
    company_research_available: z.boolean().default(true),
    status: z.enum(['generated', 'edited', 'pinned']).default('generated')
  }),
  role: z.object({
    title: z.string().default(''),
    seniority: z.string().default(''),
    responsibilities: z.array(z.string()).default([]),
    requirements: z.array(requirementSchema)
  }),
  questions: z.array(questionSchema),
  flashcards: z.array(flashcardSchema),
  schedule: z.object({
    days_available: z.number().int().min(1).max(60),
    days: z.array(dayScheduleSchema)
  }),
  coverage: z.object({
    uncovered_requirement_ids: z.array(z.string()).default([]),
    passes: z.number().int().min(1).default(1)
  })
});
