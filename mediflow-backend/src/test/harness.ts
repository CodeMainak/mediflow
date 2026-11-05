import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";

let server: MongoMemoryServer;

/** Real MongoDB, so ownership filters, unique indexes and atomic updates are actually exercised. */
export async function startDatabase(): Promise<void> {
    server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function stopDatabase(): Promise<void> {
    await mongoose.disconnect();
    await server.stop();
}

export async function clearDatabase(): Promise<void> {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

let userCounter = 0;

/** Creates a user directly and returns a token that passes the real auth middleware. */
export async function signedInUser(role: IUser["role"], extra: Record<string, unknown> = {}) {
    userCounter++;
    const user = await User.create({
        name: `${role} ${userCounter}`,
        email: `${role.toLowerCase()}${userCounter}@example.test`,
        password: "not-a-real-hash",
        role,
        ...extra,
    });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env["JWT_SECRET"] as string, { algorithm: "HS256" });
    return { user, token, auth: { Authorization: `Bearer ${token}` } };
}
