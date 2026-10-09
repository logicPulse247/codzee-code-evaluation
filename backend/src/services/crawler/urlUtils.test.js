import { describe, it, expect, vi } from 'vitest';
import { isPrivateIp, validateAndNormalizeUrlAsync, validateAndNormalizeUrl } from './urlUtils.js';

describe('urlUtils - SSRF Validation', () => {
  describe('isPrivateIp', () => {
    it('detects standard loopback and private IPv4', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('192.168.1.1')).toBe(true);
      expect(isPrivateIp('169.254.169.254')).toBe(true);
      expect(isPrivateIp('0.0.0.0')).toBe(true);
    });

    it('detects IPv6 loopback, bracketed IPv6, and private IPv6', () => {
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('[::1]')).toBe(true);
      expect(isPrivateIp('fc00::1')).toBe(true);
      expect(isPrivateIp('fe80::1')).toBe(true);
    });

    it('detects alternative IPv4 formats (hex, octal, shorthand decimal)', () => {
      // 0x7f.1 evaluates to 127.0.0.1
      expect(isPrivateIp('0x7f.1')).toBe(true);
      expect(isPrivateIp('2130706433')).toBe(true); // 127.0.0.1 in decimal integer format
      expect(isPrivateIp('0177.0.0.1')).toBe(true); // octal 127.0.0.1
    });

    it('allows valid public IPs', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
      expect(isPrivateIp('93.184.216.34')).toBe(false);
    });
  });

  describe('validateAndNormalizeUrlAsync', () => {
    it('accepts valid public domain URLs', async () => {
      const result = await validateAndNormalizeUrlAsync('https://stripe.com/jobs');
      expect(result).toBe('https://stripe.com/jobs');
    });

    it('prepends https:// when scheme is missing', async () => {
      const result = await validateAndNormalizeUrlAsync('google.com');
      expect(result).toBe('https://google.com/');
    });

    it('blocks internal hostnames and localhost', async () => {
      await expect(validateAndNormalizeUrlAsync('http://localhost:5000')).rejects.toThrow('Private, loopback, or internal URLs are restricted.');
      await expect(validateAndNormalizeUrlAsync('http://metadata.google.internal')).rejects.toThrow('Private, loopback, or internal URLs are restricted.');
    });

    it('blocks bracketed IPv6 loopback [::1]', async () => {
      await expect(validateAndNormalizeUrlAsync('http://[::1]:8000')).rejects.toThrow('Private, loopback, or internal IP addresses are restricted.');
    });

    it('blocks hex / shorthand IP representations like 0x7f.1', async () => {
      await expect(validateAndNormalizeUrlAsync('http://0x7f.1/admin')).rejects.toThrow('Private, loopback, or internal IP addresses are restricted.');
    });

    it('blocks bare hostnames without dot TLD', async () => {
      await expect(validateAndNormalizeUrlAsync('http://intranet')).rejects.toThrow('URL must be a public domain name');
    });

    it('blocks non-http/https protocols', async () => {
      await expect(validateAndNormalizeUrlAsync('file:///etc/passwd')).rejects.toThrow('Protocol "file:" is not allowed');
      await expect(validateAndNormalizeUrlAsync('gopher://example.com')).rejects.toThrow('Protocol "gopher:" is not allowed');
    });
  });
});
