/**
 * Extracts and logs error details in a format that shows up properly
 * in serverless logs (Netlify, Vercel, etc.).
 *
 * Returns the error message string so it can be included in the response.
 */
export function logError(label: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  // Log as plain strings — complex objects get swallowed in serverless logs
  console.error(`[API ERROR] ${label}: ${message}`);
  if (stack) {
    console.error(stack);
  }

  // For Mongoose ValidationErrors, log each field error
  if (
    error &&
    typeof error === "object" &&
    "errors" in error &&
    typeof (error as Record<string, unknown>).errors === "object"
  ) {
    const validationErrors = (error as { errors: Record<string, { message: string }> }).errors;
    for (const [field, err] of Object.entries(validationErrors)) {
      console.error(`  → ${field}: ${err.message}`);
    }
  }

  return message;
}
