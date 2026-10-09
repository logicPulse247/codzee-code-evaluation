import { URL } from 'url';
import { env } from '../../config/env.js';

export function validateAndNormalizeUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new Error('INVALID_URL: Company URL must be a non-empty string.');
  }

  let normalized = inputUrl.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch (err) {
    throw new Error(`INVALID_URL: Invalid URL structure: ${inputUrl}`);
  }

  // SSRF Protection check (skip check in development/test/evaluation to allow local evaluation servers)
  if (env.NODE_ENV === 'production') {
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.31.')
    ) {
      throw new Error('INVALID_URL: Private or loopback IP addresses are restricted in production.');
    }
  }

  return parsed.toString();
}

export function resolveRelativeUrl(href, baseUrl) {
  try {
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') {
      return null;
    }
    const resolved = new URL(href, baseUrl);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return null;
    }
    return resolved.toString();
  } catch (e) {
    return null;
  }
}
