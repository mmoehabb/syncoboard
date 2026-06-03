import type { NextRequest } from "next/server";

/**
 * Securely extracts the client IP address from a NextRequest.
 *
 * 1. Checks x-forwarded-for. If running behind a custom proxy, it takes the rightmost IP
 *    address in the list to prevent IP spoofing attacks (this represents the proxy
 *    closest to our server that we trust).
 * 2. Falls back to x-real-ip.
 * 3. Finally falls back to "unknown".
 *
 * @param req The NextRequest object
 * @returns The extracted IP address
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list of IPs.
    // The leftmost IP is the original client, but it can be spoofed.
    // The rightmost IP is the one appended by the last proxy.
    // By taking the rightmost IP, we rely on the IP provided by the proxy we trust.
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    if (ips.length > 0) {
      return ips[ips.length - 1];
    }
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}
