/**
 * interviewSearchService.js
 *
 * Searches public sources for real interview experiences shared by candidates.
 *
 * Search layer priority (stops as soon as one layer returns results):
 *   1. Reddit JSON Search API  — structured JSON, no auth, no scraping
 *   2. Serper.dev Google API   — reliable Google results (requires SERPER_API_KEY)
 *   3. DuckDuckGo HTML         — last-resort fallback, no API key needed
 *
 * After URLs are discovered, pages are fetched:
 *   - Reddit threads  → appended with .json so we get full post + comments
 *   - Other pages     → direct HTML fetch with cheerio parsing
 */

import * as cheerio from 'cheerio';
import { fetchWithRetryAndRateLimit } from '../crawler/fetcher.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

// ── Constants ──────────────────────────────────────────────────────────────────

// Sources we want to surface from Google/DDG searches
const TARGET_SOURCES = [
  'reddit.com',
  'glassdoor.com',
  'levels.fyi',
  'teamblind.com',
  'blind.com',
  'quora.com',
  'indeed.com',
  'careercup.com',
  'leetcode.com/discuss',
  'rooftopslush.com',
];

// Max pages to crawl after discovery
const MAX_PAGES_TO_CRAWL = 6;

// Max characters to extract from each non-Reddit page
const MAX_PAGE_CHARS = 4000;

// Max characters to extract from each Reddit thread
const MAX_REDDIT_CHARS = 5000;

// ── Layer 1: Reddit JSON Search API ───────────────────────────────────────────

/**
 * Search Reddit directly using its public JSON search endpoint.
 * Returns an array of { url, title, subreddit } objects.
 * No API key or auth required.
 */
async function searchRedditJson(companyName, roleHint = '') {
  const role = roleHint && roleHint.length > 2 ? ` ${roleHint}` : '';

  // Try two targeted queries — one with role, one without
  const queries = [
    `${companyName}${role} interview experience`,
    `${companyName} interview process hiring`,
  ];

  // Subreddits most likely to have interview experiences
  const subreddits = [
    'cscareerquestions',
    'ExperiencedDevs',
    'interviews',
    'jobs',
    'engineering',
  ];

  const results = [];

  for (const query of queries) {
    // 1a. Global Reddit search
    const globalUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=8&type=link`;
    try {
      const res = await fetchWithRetryAndRateLimit(globalUrl, {
        headers: {
          'User-Agent': 'TraoInterviewPrepBot/1.0 (+https://trao.io)',
          'Accept': 'application/json',
        }
      }, 2, 8000);

      if (res.ok && res.text) {
        const data = JSON.parse(res.text);
        const posts = data?.data?.children || [];
        for (const post of posts) {
          const d = post?.data;
          if (!d || !d.permalink) continue;
          const postUrl = `https://www.reddit.com${d.permalink}`;
          // Only include posts that mention the company name
          const titleLower = (d.title || '').toLowerCase();
          const nameLower = companyName.toLowerCase();
          if (titleLower.includes(nameLower) || titleLower.includes('interview')) {
            results.push({
              url: postUrl,
              title: d.title || postUrl,
              source: 'reddit.com',
              score: d.score || 0,
            });
          }
        }
      }
    } catch (err) {
      logger.debug(`[InterviewSearch] Reddit global search error: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 400));

    // 1b. Per-subreddit search for the most relevant communities
    for (const sub of subreddits.slice(0, 3)) {
      const subUrl = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(companyName + ' interview')}&restrict_sr=1&sort=relevance&limit=5`;
      try {
        const res = await fetchWithRetryAndRateLimit(subUrl, {
          headers: {
            'User-Agent': 'TraoInterviewPrepBot/1.0 (+https://trao.io)',
            'Accept': 'application/json',
          }
        }, 1, 7000);

        if (res.ok && res.text) {
          const data = JSON.parse(res.text);
          const posts = data?.data?.children || [];
          for (const post of posts) {
            const d = post?.data;
            if (!d || !d.permalink) continue;
            const postUrl = `https://www.reddit.com${d.permalink}`;
            results.push({
              url: postUrl,
              title: d.title || postUrl,
              source: 'reddit.com',
              score: d.score || 0,
            });
          }
        }
      } catch (err) {
        logger.debug(`[InterviewSearch] Reddit /r/${sub} search error: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Deduplicate by URL and sort by upvote score (most discussed first)
  const seen = new Set();
  const unique = results.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
  unique.sort((a, b) => (b.score || 0) - (a.score || 0));

  logger.info(`[InterviewSearch] Reddit JSON search found ${unique.length} threads for "${companyName}":`);
  unique.forEach((r, i) => logger.info(`  [Reddit ${i+1}] ${r.title} | score:${r.score} | ${r.url}`));
  return unique;
}

// ── Layer 2: Serper.dev Google Search API ─────────────────────────────────────

/**
 * Search via Serper.dev (Google results via API).
 * Requires SERPER_API_KEY in env. Free tier: 2,500 queries/month.
 * Returns an array of { url, title } objects filtered to TARGET_SOURCES.
 */
async function searchViaSerper(companyName, roleHint = '') {
  const apiKey = env.SERPER_API_KEY;
  console.log("apikey",apiKey)
  if (!apiKey) {
    logger.debug('[InterviewSearch] No SERPER_API_KEY — skipping Serper search layer');
    return [];
  }

  const role = roleHint && roleHint.length > 2 ? ` ${roleHint}` : '';
  const siteFilter = TARGET_SOURCES.slice(0, 5).map(s => `site:${s}`).join(' OR ');

  const queries = [
    `${companyName}${role} interview experience (${siteFilter})`,
    `${companyName} interview process site:glassdoor.com`,
    `${companyName} interview rounds site:levels.fyi OR site:teamblind.com`,
  ];

  const results = [];

  for (const query of queries) {
    try {
      const res = await fetchWithRetryAndRateLimit('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 8 }),
      }, 2, 10000);

      if (res.ok && res.text) {
        console.log("res result",res)
        const data = JSON.parse(res.text);
        const organic = data?.organic || [];
        logger.info(`[InterviewSearch] Serper query "${query.slice(0, 70)}" → ${organic.length} results`);
        organic.forEach((item, i) => logger.info(`  [Serper ${i+1}] ${item.title} | ${item.link}`));
        for (const item of organic) {
          const url = item.link || '';
          const isTargeted = TARGET_SOURCES.some(s => url.toLowerCase().includes(s));
          if (isTargeted) {
            results.push({ url, title: item.title || url, source: resolveSourceType(url) });
          }
        }
      }
    } catch (err) {
      logger.debug(`[InterviewSearch] Serper search error: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  // Deduplicate
  const seen = new Set();
  const unique = results.filter(r => {
    try {
      const key = new URL(r.url).hostname + new URL(r.url).pathname;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    } catch { return false; }
  });
console.log("result",results)
  logger.debug(`[InterviewSearch] Serper search found ${unique.length} targeted URLs for "${companyName}"`);
  return unique;
}

// ── Layer 3: DuckDuckGo HTML Fallback ─────────────────────────────────────────

/**
 * DuckDuckGo HTML search as the final fallback when Serper is unavailable.
 * Less reliable than Serper but requires no API key.
 */
async function searchViaDuckDuckGo(companyName, roleHint = '') {
  const role = roleHint && roleHint.length > 2 ? ` ${roleHint}` : '';
  const siteFilter = TARGET_SOURCES.slice(0, 5).map(s => `site:${s}`).join(' OR ');

  const queries = [
    `"${companyName}"${role} interview experience (${siteFilter})`,
    `"${companyName}" interview process site:reddit.com`,
    `"${companyName}" interview process site:glassdoor.com`,
  ];

  const allResults = [];

  for (const query of queries) {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    try {
      const res = await fetchWithRetryAndRateLimit(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TraoResearchBot/1.0; +https://trao.io)',
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }, 2, 8000);

      if (!res.ok || !res.text) continue;

      const $ = cheerio.load(res.text);
      $('a.result__a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const title = $(el).text().trim();

        let resolved = href;
        try {
          if (href.includes('uddg=')) {
            const uddg = new URL('https://duckduckgo.com' + href).searchParams.get('uddg');
            if (uddg) resolved = decodeURIComponent(uddg);
          } else if (href.startsWith('//')) {
            resolved = 'https:' + href;
          } else if (!href.startsWith('http')) {
            return;
          }
        } catch { return; }

        const isTargeted = TARGET_SOURCES.some(s => resolved.toLowerCase().includes(s));
        if (isTargeted && resolved.startsWith('http')) {
          allResults.push({ url: resolved, title, source: resolveSourceType(resolved) });
        }
      });
    } catch (err) {
      logger.debug(`[InterviewSearch] DDG error: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 700));
  }

  // Deduplicate
  const seen = new Set();
  const unique = allResults.filter(r => {
    try {
      const key = new URL(r.url).hostname + new URL(r.url).pathname;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    } catch { return false; }
  });
console.log("all result",allResults)
  logger.debug(`[InterviewSearch] DDG search found ${unique.length} targeted URLs for "${companyName}"`);
  return unique;
}

// ── Page Fetching ──────────────────────────────────────────────────────────────

/**
 * Fetch a Reddit thread as JSON using Reddit's public .json API.
 * Returns { url, title, cleanText, source } or null.
 */
async function fetchRedditThreadJson(url) {
  // Convert any reddit URL into its .json form
  // e.g. https://www.reddit.com/r/cscareerquestions/comments/abc/title/
  //   -> https://www.reddit.com/r/cscareerquestions/comments/abc/title/.json
  let jsonUrl = url.split('?')[0].replace(/\/$/, '') + '.json?limit=20';

  try {
    const res = await fetchWithRetryAndRateLimit(jsonUrl, {
      headers: {
        'User-Agent': 'TraoInterviewPrepBot/1.0 (+https://trao.io)',
        'Accept': 'application/json',
      }
    }, 2, 10000);

    if (!res.ok || !res.text) return null;

    const data = JSON.parse(res.text);

    // Reddit JSON structure: [postListing, commentsListing]
    const postData = data?.[0]?.data?.children?.[0]?.data;
    if (!postData) return null;

    const title = postData.title || url;
    const selfText = postData.selftext || '';

    // Extract top comments
    const comments = data?.[1]?.data?.children || [];
    const commentTexts = comments
      .filter(c => c.kind === 't1' && c.data?.body && c.data.body !== '[deleted]' && c.data.body !== '[removed]')
      .sort((a, b) => (b.data?.score || 0) - (a.data?.score || 0))
      .slice(0, 12)
      .map(c => c.data.body);

    const fullText = [selfText, ...commentTexts]
      .join('\n\n')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_REDDIT_CHARS);

    if (fullText.length < 50) return null;

    return { url, title, cleanText: fullText, source: 'reddit.com' };
  } catch (err) {
    logger.debug(`[InterviewSearch] Reddit JSON fetch failed for ${url}: ${err.message}`);
    return null;
  }
}

/**
 * Fetch a non-Reddit public page and extract readable text via cheerio.
 */
async function fetchPublicPage(url) {
  try {
    const res = await fetchWithRetryAndRateLimit(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      }
    }, 1, 8000);

    if (!res.ok || !res.text) return null;
    if (!res.contentType.includes('text/html') && !res.contentType.includes('text/plain')) return null;

    const $ = cheerio.load(res.text);
    $('script, style, noscript, svg, nav, footer, aside, header, .advertisement, .ad, [class*="banner"], [class*="cookie"]').remove();

    const title = $('title').first().text().trim() || $('h1').first().text().trim() || url;
    const text = $('main, article, [class*="content"], [class*="review"], [class*="interview"], body').first().text();

    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, MAX_PAGE_CHARS);

    if (cleanText.length < 80) return null;

    return { url, title, cleanText, source: resolveSourceType(url) };
  } catch (err) {
    logger.debug(`[InterviewSearch] Page fetch failed for ${url}: ${err.message}`);
    return null;
  }
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function resolveSourceType(url) {
  const lower = url.toLowerCase();
  if (lower.includes('reddit.com')) return 'reddit.com';
  if (lower.includes('glassdoor.com')) return 'glassdoor.com';
  if (lower.includes('levels.fyi')) return 'levels.fyi';
  if (lower.includes('teamblind.com') || lower.includes('blind.com')) return 'teamblind.com';
  if (lower.includes('quora.com')) return 'quora.com';
  if (lower.includes('indeed.com')) return 'indeed.com';
  if (lower.includes('leetcode.com')) return 'leetcode.com';
  return 'public';
}

// ── Main Export ────────────────────────────────────────────────────────────────

/**
 * Main entry point.
 *
 * Strategy:
 *   1. Hit Reddit's JSON search API directly for the best community threads.
 *   2. Use Serper.dev (Google) to find Glassdoor, Levels, Blind, etc. if API key present.
 *   3. Fall back to DuckDuckGo HTML scraping if Serper is unavailable.
 *   4. Crawl each discovered URL — Reddit via .json API, others via HTML.
 *
 * @param {string} companyName  - Explicit company name (not derived from URL)
 * @param {string} [roleHint]   - Role title to narrow search queries
 * @returns {Promise<Array<{ url, title, cleanText, source }>>}
 */
export async function searchPublicInterviewSources(companyName, roleHint = '') {
  if (!companyName || companyName.trim().length < 2) {
    logger.warn('[InterviewSearch] No company name provided — skipping public search');
    return [];
  }

  const name = companyName.trim();
  logger.info(`[InterviewSearch] Starting public interview search for: "${name}" (role: ${roleHint || 'any'})`);

  // ── Step 1: Reddit JSON Search (always attempted, no key needed) ─────────────
  const redditResults = await searchRedditJson(name, roleHint);

  // ── Step 2: Google/DDG Search for Glassdoor, Levels, Blind, etc. ─────────────
  let webResults = [];
  if (env.SERPER_API_KEY) {
    webResults = await searchViaSerper(name, roleHint);
  }
  // Fall back to DDG if Serper gave nothing or is not configured
  if (webResults.length === 0) {
    webResults = await searchViaDuckDuckGo(name, roleHint);
  }

  // Separate web results into Reddit and non-Reddit (DDG/Serper can also return Reddit URLs)
  const webRedditResults = webResults.filter(r => r.url.includes('reddit.com'));
  const nonRedditResults = webResults.filter(r => !r.url.includes('reddit.com'));

  // Merge Reddit results: JSON search first (higher quality), then any Reddit URLs from web search
  const allRedditUrls = new Set(redditResults.map(r => r.url));
  for (const r of webRedditResults) {
    if (!allRedditUrls.has(r.url)) {
      redditResults.push(r);
      allRedditUrls.add(r.url);
    }
  }

  // ── Step 3: Crawl pages ───────────────────────────────────────────────────────

  // Prioritise: top Reddit threads first (rich discussions), then Glassdoor/Levels/Blind
  const sourceOrder = ['glassdoor.com', 'levels.fyi', 'teamblind.com', 'blind.com', 'quora.com', 'indeed.com', 'public'];
  nonRedditResults.sort((a, b) => {
    const ar = sourceOrder.findIndex(s => a.url.includes(s));
    const br = sourceOrder.findIndex(s => b.url.includes(s));
    return (ar === -1 ? 99 : ar) - (br === -1 ? 99 : br);
  });

  // Take top Reddit threads and top non-Reddit pages, staying within MAX_PAGES_TO_CRAWL
  const redditToFetch = redditResults.slice(0, Math.ceil(MAX_PAGES_TO_CRAWL * 0.6)); // ~60% Reddit
  const nonRedditToFetch = nonRedditResults.slice(0, MAX_PAGES_TO_CRAWL - redditToFetch.length);

  logger.debug(
    `[InterviewSearch] Fetching ${redditToFetch.length} Reddit threads + ${nonRedditToFetch.length} web pages for "${name}"`
  );

  const crawledPages = [];

  // Fetch Reddit threads via JSON API
  for (const r of redditToFetch) {
    const page = await fetchRedditThreadJson(r.url);
    if (page) {
      logger.info(`[InterviewSearch] ✓ Reddit thread fetched: "${page.title}" (${page.cleanText.length} chars)`);
      crawledPages.push(page);
    } else {
      logger.info(`[InterviewSearch] ✗ Reddit thread failed: ${r.url}`);
    }
    await new Promise(res => setTimeout(res, 350));
  }

  // Fetch non-Reddit pages via HTML
  for (const r of nonRedditToFetch) {
    const page = await fetchPublicPage(r.url);
    if (page) {
      logger.info(`[InterviewSearch] ✓ Web page fetched: "${page.title}" (${page.cleanText.length} chars) [${page.source}]`);
      crawledPages.push(page);
    } else {
      logger.info(`[InterviewSearch] ✗ Web page failed: ${r.url}`);
    }
    await new Promise(res => setTimeout(res, 400));
  }

  logger.info(
    `[InterviewSearch] Successfully fetched ${crawledPages.length} pages (Reddit: ${crawledPages.filter(p => p.source === 'reddit.com').length}, Other: ${crawledPages.filter(p => p.source !== 'reddit.com').length}) for "${name}"`
  );

  return crawledPages;
  
}