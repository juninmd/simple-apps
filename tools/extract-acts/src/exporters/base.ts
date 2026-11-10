export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
}

export class ExporterError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = "ExporterError";
  }
}

export async function requestWithRetry<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body, timeoutMs = 15000, retries = 2 } = options;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = text;
      }

      if (!response.ok) {
        // Rate limiting or temporary server error retry
        if ((response.status === 429 || response.status >= 500) && attempt < retries) {
          attempt++;
          const backoff = 2 ** attempt * 200;
          await new Promise((res) => setTimeout(res, backoff));
          continue;
        }

        const errMsg =
          typeof data === "object" && data !== null && "message" in data
            ? String((data as { message: unknown }).message)
            : `Request failed with status ${response.status}`;

        throw new ExporterError(errMsg, response.status, data);
      }

      return data as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof ExporterError) {
        throw err;
      }

      const isAbort = (err as Error)?.name === "AbortError";
      const errorMsg = isAbort
        ? `Request timed out after ${timeoutMs}ms`
        : (err as Error)?.message || "Unknown network error";

      lastError = new ExporterError(errorMsg);

      if (attempt < retries) {
        attempt++;
        const backoff = 2 ** attempt * 200;
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new ExporterError("Request failed after retries");
}
