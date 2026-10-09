import robotsParser from 'robots-parser';
import { URL } from 'url';
import { logger } from '../../utils/logger.js';

const robotsCache = new Map();

export async function isUrlAllowedByRobots(targetUrl, userAgent = 'TraoInterviewPrepBot/1.0') {
  try {
    const parsed = new URL(targetUrl);
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

    if (robotsCache.has(robotsUrl)) {
      const robot = robotsCache.get(robotsUrl);
      return robot.isAllowed(targetUrl, userAgent) ?? true;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': userAgent }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const robotsText = await res.text();
      const robot = robotsParser(robotsUrl, robotsText);
      robotsCache.set(robotsUrl, robot);
      return robot.isAllowed(targetUrl, userAgent) ?? true;
    }
  } catch (err) {
    logger.debug(`[Robots] Could not fetch robots.txt for ${targetUrl}: ${err.message}`);
  }

  return true; // Default allow if robots.txt is missing or unreachable
}
