const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (
  fn,
  {
    retries = 3,
    baseDelay = 500, // ms
    maxDelay = 5000,
  } = {}
) => {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;

      const isRateLimit =
        err?.response?.status === 429 ||
        err?.message?.includes("Throttled") ||
        err?.message?.includes("rate limit");

      if (!isRateLimit || attempt > retries) {
        throw err;
      }

      const retryAfter = Number(err?.response?.headers?.["retry-after"]) * 1000;

      const delay = Math.min(
        retryAfter || baseDelay * 2 ** (attempt - 1),
        maxDelay
      );

      console.warn(
        `Rate limited. Retrying attempt ${attempt}/${retries} after ${delay}ms`
      );

      await sleep(delay);
    }
  }
};

class WebhookTaskError extends Error {
  constructor({ message, originalError, orderId, topic }) {
    super(message);
    this.name = "WebhookTaskError";
    this.orderId = orderId;
    this.topic = topic;
    this.originalError = originalError;
  }
}
export { withRetry, WebhookTaskError };
