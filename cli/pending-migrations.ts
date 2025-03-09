import path from "node:path";
import type { DB } from "../db.js";
import {
  availableMigrations,
  latestMigration,
  pendingMigrations,
} from "../migrate.js";

export async function pendingMigrationsCommand(db: DB) {
  const migrationsDir = db.config.migrationsDir;
  if (!migrationsDir) {
    console.error("migrationsDir configuration is not set");
    return 1;
  }

  const available = await availableMigrations(migrationsDir);
  const latest = await latestMigration(db);

  const pending = pendingMigrations(available, latest);

  console.log();

  if (pending.length === 0) {
    console.log("No pending migrations");
  } else {
    console.log("Pending migrations:");
    for (const migration of pending) {
      console.log(`  - ${path.relative(migrationsDir, migration.path)}`);
    }
  }
  return 0;
}
