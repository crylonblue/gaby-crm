import "dotenv/config";
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join } from "path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL is not defined");
  process.exit(1);
}

const client = createClient({ url, authToken: authToken || undefined });

async function run() {
  const sql = readFileSync(
    join(__dirname, "../drizzle/0011_insurance_structured_address.sql"),
    "utf-8"
  );
  const statements = sql
    .split(";")
    .map((s) => s.replace(/^--.*$/gm, "").trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    const clean = stmt.replace(/^--.*$/gm, "").trim();
    if (!clean) continue;
    console.log("Running:", clean.slice(0, 60) + "...");
    await client.execute(clean);
  }
  console.log("Migration completed successfully.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
