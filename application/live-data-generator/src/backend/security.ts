interface RateLimitState {
  count: number;
  resetAt: number;
}

export interface GeneratorSecurityOptions {
  readonly allowedOrigins?: readonly string[];
  readonly rateLimitMaxRequests?: number;
  readonly rateLimitWindowMs?: number;
}

const DEFAULT_ALLOWED_ORIGINS = [
  "http://127.0.0.1:4174",
  "http://127.0.0.1:5174",
  "http://localhost:4174",
  "http://localhost:5174",
  "http://generator.cicada-sense.localhost",
];

export class GeneratorSecurity {
  private readonly allowedOrigins: Set<string>;
  private readonly rateLimits = new Map<string, RateLimitState>();

  public constructor(
    private readonly options: GeneratorSecurityOptions = {},
    private readonly now: () => number = () => Date.now(),
  ) {
    this.allowedOrigins = new Set(options.allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS);
  }

  public allowHeaders(): string {
    return "content-type,x-request-id";
  }

  public allowMethods(): string {
    return "GET,POST,OPTIONS";
  }

  public isOriginAllowed(origin?: string): boolean {
    if (!origin) {
      return true;
    }

    return this.allowedOrigins.has(origin);
  }

  public isRateLimited(remoteAddress: string, pathname: string): boolean {
    if (!pathname.startsWith("/api/")) {
      return false;
    }

    const now = this.now();
    const key = `${remoteAddress}:${pathname}`;
    const windowMs = this.options.rateLimitWindowMs ?? 60_000;
    const maxRequests = this.options.rateLimitMaxRequests ?? 60;
    const current = this.rateLimits.get(key);

    if (!current || current.resetAt <= now) {
      this.rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }

    if (current.count >= maxRequests) {
      return true;
    }

    current.count += 1;
    return false;
  }
}
