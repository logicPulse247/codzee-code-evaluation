import { URL } from 'url';
import ipaddr from 'ipaddr.js';
import dns from 'dns/promises';

/**
 * Checks if a string or parsed IP is a private / loopback / link-local / special-use IP.
 */
export function isPrivateIp(ipStr) {
  let cleanIp = ipStr.trim();
  // Strip surrounding brackets for IPv6 if present, e.g., "[::1]" -> "::1"
  if (cleanIp.startsWith('[') && cleanIp.endsWith(']')) {
    cleanIp = cleanIp.slice(1, -1);
  }

  // Parse IP using ipaddr.js (handles decimal, octal, hex representations of IPv4 automatically, plus IPv6)
  let parsedIp;
  try {
    parsedIp = ipaddr.parse(cleanIp);
  } catch (err) {
    // Check if it's an IPv4-mapped IPv6 address or alternative notation
    return false;
  }

  const range = parsedIp.range();

  // Ranges considered private / restricted for SSRF
  const forbiddenRanges = [
    'loopback',
    'private',
    'linkLocal',
    'uniqueLocal',
    'unspecified',
    'carrierNat',
    'reserved',
    'broadcast'
  ];

  if (forbiddenRanges.includes(range)) {
    return true;
  }

  // Double-check IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
  if (parsedIp.kind() === 'ipv6' && parsedIp.isIPv4MappedAddress()) {
    const ipv4 = parsedIp.toIPv4Address();
    if (forbiddenRanges.includes(ipv4.range())) {
      return true;
    }
  }

  return false;
}

// Known cloud metadata and restricted internal hostnames (defense in depth)
const RESTRICTED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.nic.google',
  '169.254.169.254',
  'instance-data',
  '169.254.169.254.xip.io',
  'metadata.aws.internal',
  'metadata.azure.internal',
];

/**
 * Validates and normalizes a company URL.
 * Performs robust SSRF validation against IP literals (hex/decimal/octal/IPv6/bracketed)
 * and resolves DNS hostnames to verify they do not resolve to internal/private IPs.
 */
export async function validateAndNormalizeUrlAsync(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string' || !inputUrl.trim()) {
    return null; // Empty / optional URL
  }

  let raw = inputUrl.trim();
  // Check if explicit scheme was provided
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)) {
    let parsedTest;
    try {
      parsedTest = new URL(raw);
      if (!['http:', 'https:'].includes(parsedTest.protocol)) {
        throw new Error(`INVALID_URL: Protocol "${parsedTest.protocol}" is not allowed. Use http or https.`);
      }
    } catch (err) {
      if (err.message.startsWith('INVALID_URL:')) throw err;
      throw new Error(`INVALID_URL: Invalid URL format.`);
    }
  }

  let normalized = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch (err) {
    throw new Error(`INVALID_URL: Invalid URL format.`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`INVALID_URL: Protocol "${parsed.protocol}" is not allowed. Use http or https.`);
  }

  // Hostname handling
  let hostname = parsed.hostname.toLowerCase();

  // Strip brackets if parsed.hostname keeps brackets for IPv6 (e.g. "[::1]")
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  // 1. Check known metadata / internal hostnames
  if (
    RESTRICTED_HOSTNAMES.includes(hostname) ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost')
  ) {
    throw new Error('INVALID_URL: Private, loopback, or internal URLs are restricted.');
  }

  // 2. Try parsing hostname directly as an IP address (covers 0x7f.1, 127.0.0.1, ::1, hex, decimal, octal, IPv6)
  if (ipaddr.isValid(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('INVALID_URL: Private, loopback, or internal IP addresses are restricted.');
    }
    return parsed.toString();
  }

  // 3. Ensure hostname has a domain TLD (e.g. contains at least one dot: stripe.com)
  if (!hostname.includes('.')) {
    throw new Error('INVALID_URL: URL must be a public domain name (e.g. https://stripe.com).');
  }

  // 4. DNS resolution check to prevent DNS rebinding / internal domain SSRF
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new Error(`INVALID_URL: Domain ${hostname} resolves to a restricted private IP address (${addr.address}).`);
      }
    }
  } catch (dnsErr) {
    if (dnsErr.message.startsWith('INVALID_URL:')) {
      throw dnsErr;
    }
    throw new Error(`INVALID_URL: Could not resolve domain name "${hostname}".`);
  }

  return parsed.toString();
}

/**
 * Synchronous validation for fast fallback/basic checks.
 * Delegates to validateAndNormalizeUrlAsync or performs strict pattern & IP checks.
 */
export function validateAndNormalizeUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string' || !inputUrl.trim()) {
    return null;
  }

  let raw = inputUrl.trim();
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)) {
    try {
      const parsedTest = new URL(raw);
      if (!['http:', 'https:'].includes(parsedTest.protocol)) {
        throw new Error(`INVALID_URL: Protocol "${parsedTest.protocol}" is not allowed.`);
      }
    } catch (err) {
      if (err.message.startsWith('INVALID_URL:')) throw err;
      throw new Error(`INVALID_URL: Invalid URL format.`);
    }
  }

  let normalized = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch (err) {
    throw new Error(`INVALID_URL: Invalid URL format.`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`INVALID_URL: Protocol "${parsed.protocol}" is not allowed.`);
  }

  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1);
  }

  if (
    RESTRICTED_HOSTNAMES.includes(hostname) ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.localhost')
  ) {
    throw new Error('INVALID_URL: Private, loopback, or internal URLs are restricted.');
  }

  if (ipaddr.isValid(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('INVALID_URL: Private, loopback, or internal IP addresses are restricted.');
    }
  }

  if (!hostname.includes('.')) {
    throw new Error('INVALID_URL: URL must be a public domain name.');
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
