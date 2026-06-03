import { expect, test, describe, mock } from "bun:test";

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
  test("should use the rightmost IP from x-forwarded-for", async () => {
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");
    req.headers.set("x-forwarded-for", "10.0.0.1, 10.0.0.2, 10.0.0.3");

    expect(getClientIp(req as any)).toBe("10.0.0.3");
  });

  test("should trim whitespace from x-forwarded-for IPs", async () => {
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");
    req.headers.set("x-forwarded-for", "10.0.0.1 , 10.0.0.2 ");

    expect(getClientIp(req as any)).toBe("10.0.0.2");
  });

  test("should use x-real-ip if x-forwarded-for is missing", async () => {
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");
    req.headers.set("x-real-ip", "10.0.0.4");

    expect(getClientIp(req as any)).toBe("10.0.0.4");
  });

  test("should fallback to unknown if no IP is provided", async () => {
    const { getClientIp } = await import("@/lib/utils/ip");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest("http://localhost");

    expect(getClientIp(req as any)).toBe("unknown");
  });
});
