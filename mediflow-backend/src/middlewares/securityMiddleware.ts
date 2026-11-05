import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

const PRODUCTION_FRONTEND = "https://mediflow-frontend-sigma.vercel.app";

/**
 * Origins allowed to call the API from a browser: the production frontend,
 * FRONTEND_URL, and anything in the comma-separated ALLOWED_ORIGINS (custom
 * domains, previews). Requests with no Origin, like curl or the keep-alive
 * ping, aren't browser cross-origin calls, so CORS doesn't apply to them.
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
    if (!origin) return true;
    const allowed = [
        PRODUCTION_FRONTEND,
        process.env["FRONTEND_URL"],
        ...(process.env["ALLOWED_ORIGINS"] || "").split(","),
    ].map((o) => o?.trim().replace(/\/$/, ""));
    if (allowed.includes(origin)) return true;
    return process.env["NODE_ENV"] !== "production" && /^http:\/\/localhost:\d+$/.test(origin);
}

export const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    callback(null, isAllowedOrigin(origin));
};

/**
 * Many controllers put the caught error in their 500 response. This is the one
 * place that stops those details reaching a client, for current code and any
 * added later. It logs the route pattern and error name only: no ids, no
 * bodies, and no error messages, which can quote patient data.
 */
export const hideServerErrorDetails = (req: Request, res: Response, next: NextFunction): void => {
    const json = res.json.bind(res);
    res.json = (body: any) => {
        if (res.statusCode < 500 || !body || typeof body !== "object") return json(body);
        const { err, error, stack, ...safe } = body;
        const cause = err ?? error;
        console.error(JSON.stringify({
            event: "server_error",
            route: `${req.method} ${req.baseUrl}${req.route?.path ?? ""}`,
            status: res.statusCode,
            errorName: cause instanceof Error ? cause.name : undefined,
        }));
        return json(safe);
    };
    next();
};

// Helmet configuration for security headers
export const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
});

// Rate limiting for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env['NODE_ENV'] === 'production' ? 5 : 100, // More lenient in development
    message: "Too many login attempts, please try again after 15 minutes",
    // Only failures count, so normal use can't lock anyone out.
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
});

// Every new account gets its own daily AI allowance, so accounts can't be free to mass-create.
export const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env['NODE_ENV'] === 'production' ? 10 : 1000,
    message: "Too many accounts created from this network, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for general API endpoints
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env['NODE_ENV'] === 'production' ? 100 : 1000, // More lenient in development
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limiting for file upload endpoints
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env['NODE_ENV'] === 'production' ? 20 : 1000, // 20 uploads per IP per hour in production
    message: "Too many file uploads, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for messaging endpoints
export const messageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 messages per minute
    message: "Too many messages sent, please slow down",
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limiting for public, unauthenticated demo endpoints that call
// paid third-party APIs (OpenAI, Google Places) — no login required, so
// this is the only thing standing between a visitor and unbounded cost.
export const demoLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env['NODE_ENV'] === 'production' ? 20 : 200,
    message: "Too many demo requests from this IP, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
});
