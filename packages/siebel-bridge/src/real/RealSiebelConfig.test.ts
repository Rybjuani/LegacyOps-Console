import { describe, it, expect } from 'vitest';
import {
  DEFAULT_REAL_SIEBEL_CONFIG,
  RealSiebelConfigError,
  loadRealSiebelConfig,
  redactConfig,
  type RealSiebelConfig
} from './RealSiebelConfig.js';

function validEnv(): NodeJS.ProcessEnv {
  return {
    SIEBEL_BASE_URL: 'https://siebel.example.com',
    SIEBEL_AUTH_MODE: 'basic',
    SIEBEL_USERNAME: 'u',
    SIEBEL_PASSWORD: 'p'
  };
}

describe('RealSiebelConfig', () => {
  it('loads a valid basic config with defaults', () => {
    const cfg = loadRealSiebelConfig(validEnv());
    expect(cfg.baseUrl).toBe('https://siebel.example.com');
    expect(cfg.authMode).toBe('basic');
    expect(cfg.timeoutMs).toBe(DEFAULT_REAL_SIEBEL_CONFIG.timeoutMs);
    expect(cfg.maxRetries).toBe(DEFAULT_REAL_SIEBEL_CONFIG.maxRetries);
    expect(cfg.userAgent).toMatch(/LegacyOps-Console/);
  });

  it('throws when baseUrl is missing', () => {
    const env = validEnv();
    delete env.SIEBEL_BASE_URL;
    try {
      loadRealSiebelConfig(env);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RealSiebelConfigError);
      expect((e as RealSiebelConfigError).missing).toContain('SIEBEL_BASE_URL');
    }
  });

  it('throws when authMode=basic but username missing', () => {
    const env = validEnv();
    delete env.SIEBEL_USERNAME;
    try {
      loadRealSiebelConfig(env);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RealSiebelConfigError);
      expect((e as RealSiebelConfigError).missing).toContain('SIEBEL_USERNAME');
    }
  });

  it('throws when authMode=basic but password missing', () => {
    const env = validEnv();
    delete env.SIEBEL_PASSWORD;
    try {
      loadRealSiebelConfig(env);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RealSiebelConfigError);
      expect((e as RealSiebelConfigError).missing).toContain('SIEBEL_PASSWORD');
    }
  });

  it('throws when authMode=oauth but accessToken missing', () => {
    const env = { ...validEnv(), SIEBEL_AUTH_MODE: 'oauth' };
    delete env.SIEBEL_ACCESS_TOKEN;
    try {
      loadRealSiebelConfig(env);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RealSiebelConfigError);
      expect((e as RealSiebelConfigError).missing).toContain('SIEBEL_ACCESS_TOKEN');
    }
  });

  it('accepts oauth mode with accessToken', () => {
    const env: NodeJS.ProcessEnv = {
      SIEBEL_BASE_URL: 'https://siebel.example.com',
      SIEBEL_AUTH_MODE: 'oauth',
      SIEBEL_ACCESS_TOKEN: 'tok'
    };
    const cfg = loadRealSiebelConfig(env);
    expect(cfg.authMode).toBe('oauth');
    expect(cfg.accessToken).toBe('tok');
  });

  it('throws when timeoutMs is not a positive integer', () => {
    const env = { ...validEnv(), SIEBEL_TIMEOUT_MS: '0' };
    try {
      loadRealSiebelConfig(env);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RealSiebelConfigError);
      expect((e as RealSiebelConfigError).missing.some((m) => m.includes('TIMEOUT'))).toBe(true);
    }
  });

  it('throws when authMode is invalid', () => {
    const env = { ...validEnv(), SIEBEL_AUTH_MODE: 'ldap' as never };
    try {
      loadRealSiebelConfig(env);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RealSiebelConfigError);
      expect((e as RealSiebelConfigError).missing.some((m) => m.includes('AUTH_MODE'))).toBe(true);
    }
  });

  it('redactConfig never exposes credentials', () => {
    const cfg: RealSiebelConfig = {
      baseUrl: 'https://siebel.example.com',
      authMode: 'basic',
      username: 'myuser',
      password: 'mypass',
      accessToken: 'tok',
      timeoutMs: 8000,
      maxRetries: 2,
      retryBackoffMs: 200,
      retryJitterMs: 80,
      circuitBreakerFailureThreshold: 5,
      circuitBreakerCooldownMs: 30_000,
      defaultPageSize: 50,
      userAgent: 'test'
    };
    const redacted = redactConfig(cfg);
    expect(JSON.stringify(redacted)).not.toContain('myuser');
    expect(JSON.stringify(redacted)).not.toContain('mypass');
    expect(JSON.stringify(redacted)).not.toContain('tok');
    expect(redacted.hasUsername).toBe(true);
    expect(redacted.hasPassword).toBe(true);
    expect(redacted.hasAccessToken).toBe(true);
  });
});
