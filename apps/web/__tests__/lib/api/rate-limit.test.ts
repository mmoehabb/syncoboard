import { expect, test, describe, afterEach, setSystemTime } from 'bun:test';
import { RateLimiter } from '../../../src/lib/api/rate-limit';

describe('RateLimiter', () => {
  afterEach(() => {
    // Reset system time to normal after each test
    setSystemTime();
  });

  test('allows requests within limit', () => {
    const limiter = new RateLimiter(10000, 3);
    const ip = '192.168.1.1';

    expect(limiter.isLimited(ip)).toBe(false);
    expect(limiter.isLimited(ip)).toBe(false);
    expect(limiter.isLimited(ip)).toBe(false);
  });

  test('blocks requests exceeding limit', () => {
    const limiter = new RateLimiter(10000, 3);
    const ip = '192.168.1.2';

    expect(limiter.isLimited(ip)).toBe(false);
    expect(limiter.isLimited(ip)).toBe(false);
    expect(limiter.isLimited(ip)).toBe(false);
    expect(limiter.isLimited(ip)).toBe(true); // 4th request blocked
  });

  test('resets limit after window expires', () => {
    const limiter = new RateLimiter(10000, 2);
    const ip = '192.168.1.3';

    // Set fixed time to avoid flakiness
    const startTime = new Date('2024-01-01T00:00:00Z');
    setSystemTime(startTime);

    expect(limiter.isLimited(ip)).toBe(false);
    expect(limiter.isLimited(ip)).toBe(false);
    expect(limiter.isLimited(ip)).toBe(true); // 3rd request blocked

    // Advance time beyond windowMs (10 seconds)
    setSystemTime(new Date(startTime.getTime() + 10001));

    expect(limiter.isLimited(ip)).toBe(false); // Should be allowed again
  });

  test('tracks identifiers independently', () => {
    const limiter = new RateLimiter(10000, 2);
    const ip1 = '192.168.1.4';
    const ip2 = '192.168.1.5';

    expect(limiter.isLimited(ip1)).toBe(false);
    expect(limiter.isLimited(ip1)).toBe(false);
    expect(limiter.isLimited(ip1)).toBe(true); // ip1 blocked

    expect(limiter.isLimited(ip2)).toBe(false); // ip2 still allowed
    expect(limiter.isLimited(ip2)).toBe(false);
  });
});
