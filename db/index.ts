import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://phronesis:phronesis@localhost:5433/phronesis";

declare global {
  var __phronesisSql: ReturnType<typeof postgres> | undefined;
}

// Réutilise la connexion entre les rechargements HMR de Next.js en dev.
const client =
  globalThis.__phronesisSql ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== "production") {
  globalThis.__phronesisSql = client;
}

export const db = drizzle(client, { schema });
export { schema };
