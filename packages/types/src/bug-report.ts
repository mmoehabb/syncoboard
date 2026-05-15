export interface BugReportPayload {
  message: string;
  stack?: string;
  url?: string;
  browser?: string;
}

export interface BugReportResponse {
  success: boolean;
  id: string;
}
