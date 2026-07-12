import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For serverless environments, use a connection pool that disposes after each request.
// We reuse the connection across hot-reloads in dev.
const globalForDb = globalThis as unknown as { client: postgres.Sql | undefined };

// Supabase pooler requires SSL. Passing explicitly to postgres.js
// because ?sslmode=require in the connection string is not reliably parsed.
const client = globalForDb.client ?? postgres(connectionString, {
  prepare: false,
  ssl: "require",
});

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });
