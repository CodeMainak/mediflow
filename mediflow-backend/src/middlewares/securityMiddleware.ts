import helmet from "helmet";
import rateLimit from "express-rate-limit";

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
    max: 20, // Limit each IP to 20 uploads per hour
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
