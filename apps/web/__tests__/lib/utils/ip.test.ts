import { expect, test, describe, mock, afterEach } from "bun:test";

class MockNextRequest {
  ip?: string;
  headers: Headers;

  constructor(url: string, init?: { headers?: Record<string, string> }) {
    this.headers = new Headers(init?.headers);
  }
}

mock.module("next/server", () => ({
  NextRequest: MockNextRequest,
}));

describe("getClientIp", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("should ignore x-forwarded-for if TRUSTED_PROXIES is not set", async () => {
    process.env.TRUSTED_PROXIES = "";
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");
    req.headers.set("x-forwarded-for", "10.0.0.1, 10.0.0.2, 10.0.0.3");
    req.headers.set("x-real-ip", "10.0.0.4");

    expect(getClientIp(req as any)).toBe("10.0.0.4");
  });

  test("should return the rightmost untrusted IP if TRUSTED_PROXIES is set", async () => {
    process.env.TRUSTED_PROXIES = "10.0.0.3";
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");
    req.headers.set("x-forwarded-for", "10.0.0.1, 10.0.0.2, 10.0.0.3");

    // 10.0.0.3 is trusted, so it skips it. 10.0.0.2 is the first untrusted IP.
    expect(getClientIp(req as any)).toBe("10.0.0.2");
  });

  test("should handle multiple trusted proxies and return the rightmost untrusted IP", async () => {
    process.env.TRUSTED_PROXIES = "10.0.0.2, 10.0.0.3";
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");
    req.headers.set("x-forwarded-for", "10.0.0.1, 10.0.0.2, 10.0.0.3");

    // 10.0.0.3 and 10.0.0.2 are trusted, so it skips them. 10.0.0.1 is the first untrusted IP.
    expect(getClientIp(req as any)).toBe("10.0.0.1");
  });

  test("should fall back if all IPs are trusted", async () => {
    process.env.TRUSTED_PROXIES = "10.0.0.1, 10.0.0.2, 10.0.0.3";
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");
    req.headers.set("x-forwarded-for", "10.0.0.1, 10.0.0.2, 10.0.0.3");
    req.headers.set("x-real-ip", "10.0.0.4");

    // All are trusted, so it falls back to x-real-ip
    expect(getClientIp(req as any)).toBe("10.0.0.4");
  });

  test("should trim whitespace from x-forwarded-for IPs", async () => {
    process.env.TRUSTED_PROXIES = "10.0.0.3";
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");
    req.headers.set("x-forwarded-for", "10.0.0.1 , 10.0.0.2 , 10.0.0.3 ");

    expect(getClientIp(req as any)).toBe("10.0.0.2");
  });

  test("should use x-real-ip if x-forwarded-for is missing", async () => {
    process.env.TRUSTED_PROXIES = "10.0.0.3";
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");
    req.headers.set("x-real-ip", "10.0.0.4");

    expect(getClientIp(req as any)).toBe("10.0.0.4");
  });

  test("should fallback to unknown if no IP is provided", async () => {
    process.env.TRUSTED_PROXIES = "10.0.0.3";
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");

    expect(getClientIp(req as any)).toBe("unknown");
  });
});
