import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User, IUser } from "../models/User";

// Extend Express Request type
export interface AuthRequest extends Request {
    user?: IUser | JwtPayload;
}

// ----------------- Auth Middleware -----------------
export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers["authorization"];
    const token = typeof authHeader === "string" ? authHeader.split(" ")[1] : null;

    if (!token) {
        res.status(401).json({ msg: "No token, auth denied" });
        return;
    }

    try {
        // Assert decoded is JwtPayload
        const decoded = jwt.verify(token, process.env["JWT_SECRET"] as string) as JwtPayload;
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token invalid" });
        return;
    }
};

// ----------------- Role Middleware -----------------
export const roleMiddleware = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const user = req.user as JwtPayload | undefined;

        if (!user || !user['role'] || !roles.includes(user['role'])) {
            res.status(403).json({ msg: "Forbidden" });
            return;
        }

        next();
    };
};

// ----------------- Async Protect Middleware -----------------
export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer") ? authHeader.split(" ")[1] : null;


    if (!token) {
        res.status(401).json({ msg: "Not authorized, no token" });
        return;
    }

    try {

        const decoded = jwt.verify(token, process.env["JWT_SECRET"] as string) as JwtPayload;
        const user = await User.findById(decoded["id"]).select("-password");
        if (!user) {
            res.status(401).json({ msg: "User not found" });
            return;
        }

        req.user = user;
        next();
        return;
    } catch (err) {
        // This provides a more specific error for development/debugging
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ msg: "Token expired" });
        } else if (err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ msg: "Token invalid (signature or format)" });
        } else {
            // Fallback for other issues
            res.status(401).json({ msg: "Not authorized" });
        }
        return;
    }
};

// ----------------- Doctor Only Middleware -----------------
export const doctorOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user as IUser | undefined;


    if (!user || user.role !== "Doctor") {
        res.status(403).json({ msg: "Doctors only" });
        return;
    }

    next();
};


export const onlyRole = (roles: ("Doctor" | "Patient" | "Receptionist" | "Admin")[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        const user = req.user as IUser | undefined;
        if (!user || !roles.includes(user.role)) {
            res.status(403).json({ msg: `Forbidden` });
            return;
        }
        next();
    };
};


/*
curl --location 'http://localhost:8000/api/auth/login' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTI2YTUwOWY1ZmI0M2E4ODFhZDRkNyIsInJvbGUiOiJQYXRpZW50IiwiaWF0IjoxNzU5OTQ2MTI0LCJleHAiOjE3NjAwMzI1MjR9.uNAhxz5FP2NSfiRd6U0Tu5hy7oF6WpCjyL5-QIwDgmw' \
--data-raw '{
  "email": "john@example.com",
  "password": "123456"
}'
*/