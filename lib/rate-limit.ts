import { RateLimiterMemory } from "rate-limiter-flexible";

const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60, // 5 attempts per minute
});

const apiLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60, // 100 requests per minute
});

export async function checkLoginRateLimit(ip: string): Promise<boolean> {
  try {
    await loginLimiter.consume(ip);
    return true;
  } catch {
    return false;
  }
}

export async function checkApiRateLimit(ip: string): Promise<boolean> {
  try {
    await apiLimiter.consume(ip);
    return true;
  } catch {
    return false;
  }
}
