export function extractErrorMessage(err: unknown, defaultMessage: string = "An error occurred"): string {
  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response: unknown }).response;
    if (typeof response === "object" && response !== null && "data" in response) {
      const data = (response as { data: unknown }).data;
      if (typeof data === "object" && data !== null && "error" in data) {
        const errorObj = (data as { error: unknown }).error;
        if (
          typeof errorObj === "object" &&
          errorObj !== null &&
          "message" in errorObj &&
          typeof (errorObj as { message: unknown }).message === "string"
        ) {
          return (errorObj as { message: string }).message;
        }
      }
    }
  }

  return defaultMessage;
}
