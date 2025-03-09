import path from "node:path";
import type { DB } from "../db.js";
import {
  availableMigrations,
  latestMigration,
  lockMigrations,
  pendingMigrations,
  runMigration,
} from "../migrate.js";

export async function runMigrationsCommand(db: DB) {
  const migrationsDir = db.config.migrationsDir;
  if (!migrationsDir) {
    console.error("migrationsDir configuration is not set");
    return 1;
  }

  try {
    await lockMigrations(db);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    return 1;
  }

  const status = await latestMigration(db);
  const available = await availableMigrations(migrationsDir);
  const pending = pendingMigrations(available, status);

  if (pending.length === 0) {
    console.log();
    console.log("No pending migrations");
    return 0;
  }

  console.log();
  console.log("Migrating:");

  for (const migration of pending) {
    const prettyName = path.relative(migrationsDir, migration.path);
    console.log(`  - ${prettyName}`);
    try {
      await runMigration(db, migration);
    } catch (e) {
      console.error();
      console.error(`Migration ${prettyName} failed:`);
      console.error(e instanceof Error ? e.message : e);
      return 1;
    }
  }

  return 0;
}
