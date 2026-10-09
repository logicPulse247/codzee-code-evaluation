import { extractRequirements } from './stage1_requirements.js';
import { researchCompany } from '../webResearch/companyResearchService.js';
import { researchPublicInterviewProcess } from '../webResearch/publicInterviewResearchService.js';
import { generateInitialQuestions } from './stage4_questionGeneration.js';
import { runSecondPassGeneration } from './stage6_secondPass.js';
import { allocateSchedule } from '../schedule/scheduleAllocator.js';
import { generateFlashcards } from './stage8_flashcards.js';
import { kitSchema } from '../validation/kitSchemas.js';
import { validateAndNormalizeUrlAsync } from '../crawler/urlUtils.js';
import { logger } from '../../utils/logger.js';

export async function runKitPipeline({ jd, companyUrl, days = 5, onProgress = () => {} }) {
  const daysAvailable = Math.max(1, Math.min(60, Number(days) || 5));

  // Validate company URL server-side against SSRF (private IPs, loopback, hex/dec IPs, internal DNS names)
  if (companyUrl && typeof companyUrl === 'string' && companyUrl.trim()) {
    try {
      await validateAndNormalizeUrlAsync(companyUrl);
    } catch (err) {
      const msg = err.message.replace(/^INVALID_URL:\s*/, '');
      const urlErr = new Error(`Company URL validation failed: ${msg}`);
      urlErr.status = 400;
      throw urlErr;
    }
  }

  // Step 1: Requirement Extraction
  await onProgress('ANALYZING_JD', 'Analyzing job description...');
  const stage1Result = await extractRequirements(jd);
  const requirements = stage1Result.requirements || [];

  // ── THIN KIT SHORT-CIRCUIT ──────────────────────────────────────────────────
  // When the JD is gibberish, empty, or contains no extractable requirements,
  // we still run company research (honest about what was found) but skip all
  // question / flashcard / schedule generation entirely.
  const isInvalidJd = stage1Result.is_invalid_jd || requirements.length === 0;

  if (isInvalidJd) {
    await onProgress('RESEARCHING_COMPANY', 'Researching company...');
    await onProgress('DISCOVERING_PAGES', 'Discovering relevant pages...');
    const companyBriefResult = await researchCompany(companyUrl);

    await onProgress('VALIDATING_KIT', 'Building honest thin kit (no valid job description)...');

    const companyResearchAvailable = companyBriefResult.company_research_available !== false;
    const companyName = resolveCompanyName(companyUrl, companyBriefResult);

    const qualityNote = stage1Result.jd_quality_note
      || 'The text provided does not appear to be a valid job description. No requirements were extracted, so no questions, flashcards, or study schedule could be generated.';

    const thinKit = {
      source: {
        company: companyName,
        company_url: companyUrl || '',
        role: 'Unknown Role',
        location: '',
        jd_chars: (jd || '').length,
        is_thin_jd: true,
        is_invalid_jd: true,
        jd_quality_note: qualityNote,
        data_quality: 'none',
        researched_at: new Date().toISOString(),
        pages_used: companyBriefResult.pages_used || []
      },
      company_brief: {
        summary: companyBriefResult.summary || 'No company information was found.',
        what_they_do: companyBriefResult.what_they_do || 'No company data retrieved.',
        sources: companyBriefResult.pages_used || [],
        company_research_available: companyResearchAvailable,
        status: 'generated'
      },
      role: {
        title: 'Unknown Role',
        seniority: 'Unknown',
        responsibilities: [],
        requirements: []
      },
      questions: [],
      flashcards: [],
      schedule: { days_available: daysAvailable, days: [] },
      coverage: { uncovered_requirement_ids: [], passes: 0 },
      research: {
        crawled_pages: (companyBriefResult.pages_used || []).map(url => ({
          url,
          title: `${companyName} Web Resource`
        })),
        skipped_pages: companyBriefResult.pages_skipped || [],
        process_steps: [],
        insights: [],
        public_sources: [],
        interview_summary: ''
      }
    };

    const validation = kitSchema.safeParse(thinKit);
    if (!validation.success) {
      logger.warn('[Kit Pipeline] Thin-kit Zod validation issue:', validation.error.message);
      return thinKit;
    }
    return validation.data;
  }
  // ── END SHORT-CIRCUIT ───────────────────────────────────────────────────────

  // Step 2: Company Crawl & Research
  await onProgress('RESEARCHING_COMPANY', 'Researching company...');
  await onProgress('DISCOVERING_PAGES', 'Discovering relevant pages...');
  const companyBriefResult = await researchCompany(companyUrl);

  // Step 3: Public Interview Process Research
  await onProgress('SEARCHING_DISCUSSIONS', 'Searching public interview discussions...');
  // Use the LLM-extracted role title, but never the generic heuristic fallback "Software Engineer"
  // which fires when the LLM is unavailable. Pass the raw JD text so the research service
  // can classify the role itself from the actual job description.
  const roleHint = (
    stage1Result.role_title &&
    stage1Result.role_title !== 'Unspecified Role' &&
    stage1Result.role_title !== 'Software Engineer' &&
    stage1Result.role_title !== 'Unknown Role'
  ) ? stage1Result.role_title : '';
  const companyWebFallbackText = companyBriefResult.what_they_do || companyBriefResult.summary || '';

  // Derive the best available company name to pass explicitly to the research service.
  const resolvedCompanyName = resolveCompanyName(companyUrl, companyBriefResult);

  const interviewResearchResult = await researchPublicInterviewProcess(
    companyUrl,
    companyWebFallbackText,
    roleHint,
    resolvedCompanyName,  // 4th arg: explicit name, avoids naive URL parsing
    jd                    // 5th arg: raw JD text for accurate role classification
  );

  // Step 4: Initial Question Generation
  await onProgress('GENERATING_QUESTIONS', 'Generating questions...');
  const initialQuestions = await generateInitialQuestions(
    requirements,
    companyBriefResult,
    stage1Result,
    { isThinJd: stage1Result.is_thin_jd, companyResearchAvailable: companyBriefResult.company_research_available }
  );

  // Step 5 & 6: Coverage Check & Second Pass Generation
  await onProgress('CHECKING_COVERAGE', 'Checking requirement coverage...');
  const secondPassResult = await runSecondPassGeneration(requirements, initialQuestions, companyBriefResult);

  if (secondPassResult.coverage.uncovered_requirement_ids.length > 0) {
    await onProgress('GENERATING_MISSING', 'Generating missing questions for coverage...');
  }

  // Step 7: Deterministic Schedule Allocation
  await onProgress('BUILDING_SCHEDULE', 'Building study schedule...');
  const scheduleResult = allocateSchedule(secondPassResult.questions, requirements, daysAvailable);

  // Step 8: Flashcard Generation
  await onProgress('GENERATING_FLASHCARDS', 'Generating flashcards...');
  const flashcards = await generateFlashcards(requirements, secondPassResult.questions, { isThinJd: stage1Result.is_thin_jd });

  // Step 9: Final Kit Schema Assembly & Validation
  await onProgress('VALIDATING_KIT', 'Validating final kit...');

  const companyName = resolveCompanyName(companyUrl, companyBriefResult);

  const roleTitle =
    stage1Result.role_title &&
    stage1Result.role_title !== 'Unspecified Role' &&
    stage1Result.role_title !== 'Unknown Role'
      ? stage1Result.role_title
      : 'Software Engineer';

  const usedPages = companyBriefResult.pages_used?.length
    ? companyBriefResult.pages_used
    : [];

  const crawledPagesList = usedPages.map(url => ({
    url,
    title: `${companyName} Web Resource`
  }));

  const processStepsList = (interviewResearchResult.found && interviewResearchResult.process_steps?.length)
    ? interviewResearchResult.process_steps.map((step, idx) => ({
        round_name: typeof step === 'string' ? step : `Round ${idx + 1}`,
        description: 'Structured assessment evaluating role requirements and core candidate competencies.'
      }))
    : [];

  // Derive overall data quality
  const isThinJd = stage1Result.is_thin_jd || false;
  const companyResearchAvailable = companyBriefResult.company_research_available !== false;
  let overallDataQuality = 'full';
  if (isThinJd && !companyResearchAvailable) overallDataQuality = 'none';
  else if (isThinJd || !companyResearchAvailable) overallDataQuality = 'thin';
  else if (companyBriefResult.data_quality === 'partial') overallDataQuality = 'partial';

  const rawKit = {
    source: {
      company: companyName,
      company_url: companyUrl || '',
      role: roleTitle,
      location: 'Remote / On-site',
      jd_chars: (jd || '').length,
      is_thin_jd: isThinJd,
      is_invalid_jd: false,
      jd_quality_note: stage1Result.jd_quality_note || '',
      data_quality: overallDataQuality,
      researched_at: new Date().toISOString(),
      pages_used: usedPages
    },
    company_brief: {
      summary: companyBriefResult.summary || (companyResearchAvailable
        ? 'No public company details found.'
        : 'No public information could be retrieved from the company site.'),
      what_they_do: companyBriefResult.what_they_do || (companyResearchAvailable
        ? 'No product or tech stack details found.'
        : 'Company site was not accessible or contained no parseable content.'),
      sources: usedPages,
      company_research_available: companyResearchAvailable,
      status: 'generated'
    },
    role: {
      title: roleTitle,
      seniority: stage1Result.seniority || 'Mid-Senior',
      responsibilities: stage1Result.responsibilities || [],
      requirements
    },
    questions: secondPassResult.questions,
    flashcards,
    schedule: scheduleResult,
    coverage: secondPassResult.coverage,
    research: {
      crawled_pages: crawledPagesList,
      skipped_pages: companyBriefResult.pages_skipped || [],
      process_steps: processStepsList,
      insights: (interviewResearchResult.found && interviewResearchResult.key_insights?.length)
        ? interviewResearchResult.key_insights
        : [],
      public_sources: interviewResearchResult.public_sources || [],
      interview_summary: interviewResearchResult.found
        ? (interviewResearchResult.summary || '')
        : ''
    }
  };

  // Validate with Zod schema
  const validation = kitSchema.safeParse(rawKit);
  if (!validation.success) {
    logger.warn('[Kit Pipeline] Zod validation failed on raw generated kit:', validation.error.message);
    return rawKit;
  }

  return validation.data;
}

/**
 * Derives a display-safe company name from the URL or brief summary.
 * Priority:
 *   1. Company name extracted from brief summary (LLM-generated, most accurate)
 *   2. URL-based extraction with ATS host awareness
 *   3. 'Unknown Company' fallback
 */
function resolveCompanyName(companyUrl, companyBriefResult) {
  // 1. Try to pull the company name out of the LLM-generated summary.
  //    The summary typically starts with "<CompanyName> is ..." or "About <CompanyName>".
  if (companyBriefResult?.summary && typeof companyBriefResult.summary === 'string') {
    const summaryClean = companyBriefResult.summary.trim();
    // Match patterns like "Stripe is a ...", "About Acme Corp ...", "FAANG Inc is ..."
    const nameMatch = summaryClean.match(/^(?:About\s+)?([A-Z][A-Za-z0-9&\-. ]{1,40?}?)\s+(?:is\s|are\s|–|-|:)/);
    if (nameMatch && nameMatch[1]) {
      const candidate = nameMatch[1].trim().replace(/\.$/, '');
      if (candidate.length > 1 && !['No', 'The', 'Basic', 'None', 'Public', 'Company'].includes(candidate)) {
        return candidate;
      }
    }
  }

  // 2. URL-based extraction with ATS host awareness
  if (companyUrl && typeof companyUrl === 'string' && companyUrl.trim().length > 0) {
    try {
      const parsed = new URL(companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`);
      const hostname = parsed.hostname.replace(/^www\./i, '');

      // ATS / job board hosts — real company name is in the pathname
      const atsBoardHosts = [
        'greenhouse.io', 'lever.co', 'workday.com', 'ashbyhq.com',
        'recruitee.com', 'bamboohr.com', 'workable.com', 'jobvite.com',
        'icims.com', 'taleo.net', 'smartrecruiters.com', 'myworkdayjobs.com',
      ];
      const isAtsHost = atsBoardHosts.some(h => hostname.endsWith(h));
      if (isAtsHost) {
        const segment = parsed.pathname.split('/').filter(Boolean)[0];
        if (segment && segment.length > 1 && !/^\d+$/.test(segment)) {
          return segment.charAt(0).toUpperCase() + segment.slice(1);
        }
      }

      // Regular company domain — second-to-last label (avoids "www", "jobs", etc.)
      const parts = hostname.split('.');
      const candidate = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
      if (candidate && candidate.length > 1) {
        return candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    } catch (e) {
      // fall through
    }
  }

  return 'Unknown Company';
}
