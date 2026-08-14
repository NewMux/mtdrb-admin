import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { users, type InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";

let database: ReturnType<typeof drizzle> | null = null;
export async function getDb() { if (!database && process.env.DATABASE_URL) database = drizzle(process.env.DATABASE_URL); return database; }
export async function upsertUser(user: InsertUser) { const db = await getDb(); if (!db || !user.openId) return; const values: InsertUser = { ...user, lastSignedIn: user.lastSignedIn || new Date(), role: user.openId === ENV.ownerOpenId ? "admin" : user.role || "user" }; await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, loginMethod: values.loginMethod, lastSignedIn: values.lastSignedIn, role: values.role } }); }
export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0]; }
