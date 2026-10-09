import * as cheerio from 'cheerio';
import { resolveRelativeUrl } from './urlUtils.js';

const HIGH_PRIORITY_KEYWORDS = [
  'careers', 'jobs', 'hiring', 'handbook', 'engineering', 'tech',
  'interview', 'culture', 'values', 'join-us', 'work-at', 'blog', 'stack'
];

const SECONDARY_KEYWORDS = [
  'about', 'product', 'team', 'company', 'mission', 'platform', 'solutions', 'architecture'
];

const IGNORE_PATTERNS = [
  'twitter.com', 'linkedin.com', 'facebook.com', 'instagram.com', 'youtube.com',
  'github.com', 'privacy', 'terms', 'cookie', 'login', 'signup', 'signin', 'register'
];

export function parsePageHtml(html, baseUrl) {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $('script, style, noscript, svg, nav, footer, iframe').remove();

  // Extract page title
  const title = $('title').text().trim() || $('h1').first().text().trim() || '';

  // Extract base host for internal link boosting
  let baseHost = '';
  try {
    baseHost = new URL(baseUrl).hostname.replace(/^www\./i, '');
  } catch (e) {}

  // Extract links and rank by relevance
  const extractedLinks = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const linkText = $(el).text().trim();
    const resolvedUrl = resolveRelativeUrl(href, baseUrl);

    if (resolvedUrl) {
      const lowerUrl = resolvedUrl.toLowerCase();
      const lowerText = linkText.toLowerCase();
      const combined = `${lowerUrl} ${lowerText}`;

      // Skip ignored domains/patterns (e.g. social media, login links)
      if (IGNORE_PATTERNS.some(pat => lowerUrl.includes(pat))) {
        return;
      }

      let score = 0;

      // Internal link boost
      try {
        if (baseHost && new URL(resolvedUrl).hostname.includes(baseHost)) {
          score += 15;
        }
      } catch (e) {}

      // High-priority keyword scoring
      HIGH_PRIORITY_KEYWORDS.forEach((kw) => {
        if (combined.includes(kw)) score += 35;
      });

      // Secondary keyword scoring
      SECONDARY_KEYWORDS.forEach((kw) => {
        if (combined.includes(kw)) score += 10;
      });

      if (score > 0) {
        extractedLinks.push({ url: resolvedUrl, text: linkText, score });
      }
    }
  });

  // Deduplicate and sort links descending by score
  const uniqueLinksMap = new Map();
  extractedLinks.forEach(link => {
    if (!uniqueLinksMap.has(link.url) || uniqueLinksMap.get(link.url).score < link.score) {
      uniqueLinksMap.set(link.url, link);
    }
  });

  const rankedLinks = Array.from(uniqueLinksMap.values()).sort((a, b) => b.score - a.score);

  // Clean visible text
  const cleanText = $('body')
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 15000); // Limit page text length

  return {
    title,
    cleanText,
    rankedLinks
  };
}
