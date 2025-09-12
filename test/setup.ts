// Test setup file
import { vi } from 'vitest';

// Mock environment variables
Object.defineProperty(process, 'env', {
  value: {
    ...process.env,
    GITHUB_API_BASE_URL: 'https://api.github.com',
    GITHUB_API_TOKEN: 'test-token',
    GITHUB_API_RATE_LIMIT_REQUESTS_PER_HOUR: '5000',
  },
});

// Global test utilities
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
};