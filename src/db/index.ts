import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Deferred so the module can be imported during Next.js build without a live DB.
// The error surfaces on the first actual query at runtime.
const client = postgres(process.env.DATABASE_URL ?? "", {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // Suppress immediate connection errors — they will surface on first query
  connection: {},
});

export const db = drizzle(client, { schema });
