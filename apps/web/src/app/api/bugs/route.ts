import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { prisma } from "@syncoboard/db";
import { RateLimiter } from "@/lib/api/rate-limit";
import type { BugReportPayload, BugReportResponse } from "@syncoboard/types";

// Limit to 5 requests per minute per IP
const rateLimiter = new RateLimiter(60 * 1000, 5);

export async function POST(req: Request) {
  // Simple IP extraction (this is basic and might need adjustment if behind a proxy like Cloudflare)
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimiter.isLimited(ip)) {
    return apiError(
      API_ERRORS.customTooManyRequests(
        "Too many requests, please try again later",
      ),
    );
  }

  const userId = await getSessionOrPat();

  try {
    const body: BugReportPayload = await req.json();
    let { message, stack, url, browser } = body;

    if (!message) {
      return apiError(API_ERRORS.customBadRequest("Message is required"));
    }

    if (typeof message !== "string") {
      return apiError(API_ERRORS.customBadRequest("Message must be a string"));
    }

    // Sanitize and validate inputs
    if (message.length > 2000) {
      return apiError(API_ERRORS.customBadRequest("Message is too long"));
    }
    message = message.replace(/[\x00-\x1F\x7F]/g, " ");

    if (stack) {
      if (typeof stack !== "string") {
        return apiError(API_ERRORS.customBadRequest("Stack must be a string"));
      }
      if (stack.length > 5000) {
        return apiError(API_ERRORS.customBadRequest("Stack trace is too long"));
      }
      stack = stack.replace(/[\x00-\x1F\x7F]/g, " ");
    }

    if (url) {
      if (typeof url !== "string") {
        return apiError(API_ERRORS.customBadRequest("URL must be a string"));
      }
      if (url.length > 2000) {
        return apiError(API_ERRORS.customBadRequest("URL is too long"));
      }
      url = url.replace(/[\x00-\x1F\x7F]/g, " ");
    }

    if (browser) {
      if (typeof browser !== "string") {
        return apiError(
          API_ERRORS.customBadRequest("Browser must be a string"),
        );
      }
      if (browser.length > 1000) {
        return apiError(
          API_ERRORS.customBadRequest("Browser string is too long"),
        );
      }
      browser = browser.replace(/[\x00-\x1F\x7F]/g, " ");
    }

    const bugReport = await prisma.bugReport.create({
      data: {
        userId,
        message,
        stack,
        url,
        browser,
      },
    });

    const response: BugReportResponse = {
      success: true,
      id: bugReport.id,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error reporting bug:", error);
    return apiError(API_ERRORS.customInternal("Failed to report bug"));
  }
}
