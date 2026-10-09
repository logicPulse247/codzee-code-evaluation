import { logger } from '../../utils/logger.js';

// Domain-level rate limiter timestamps
const domainLastFetchMap = new Map();
const MIN_DOMAIN_DELAY_MS = 250; // Minimum delay between requests to same domain

async function enforceRateLimit(url) {
  try {
    const hostname = new URL(url).hostname;
    const lastFetch = domainLastFetchMap.get(hostname) || 0;
    const now = Date.now();
    const elapsed = now - lastFetch;

    if (elapsed < MIN_DOMAIN_DELAY_MS) {
      const waitMs = MIN_DOMAIN_DELAY_MS - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    domainLastFetchMap.set(hostname, Date.now());
  } catch (e) {
    // Ignore URL parse error in rate limit
  }
}

export async function fetchWithRetryAndRateLimit(url, options = {}, maxRetries = 2, timeoutMs = 5000) {
  await enforceRateLimit(url);

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'TraoInterviewPrepBot/1.0 (Research Agent; +https://trao.io)',
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);

      // Handle rate limit (429) or server errors (5xx) with exponential backoff
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt) * 500 + Math.random() * 200;
          logger.warn(`[Crawler] HTTP ${response.status} for ${url}. Backing off ${Math.round(backoffMs)}ms (Attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((res) => setTimeout(res, backoffMs));
          attempt++;
          continue;
        }
      }

      const contentType = response.headers.get('content-type') || '';
      const text = response.ok ? await response.text() : '';

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType,
        text,
        error: response.ok ? null : `HTTP ${response.status} ${response.statusText}`
      };
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err.name === 'AbortError' ? 'Request Timeout' : err.message;

      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 400;
        logger.debug(`[Crawler] Fetch error for ${url}: ${lastError}. Retrying in ${backoffMs}ms...`);
        await new Promise((res) => setTimeout(res, backoffMs));
        attempt++;
      } else {
        break;
      }
    }
  }

  return {
    ok: false,
    status: 0,
    statusText: 'Failed',
    contentType: '',
    text: '',
    error: lastError || 'Network request failed'
  };
}
