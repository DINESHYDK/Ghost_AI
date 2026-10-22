import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // process.env (not env()) so `prisma generate` also works without a database URL.
    url: process.env.DATABASE_URL,
  },
});
