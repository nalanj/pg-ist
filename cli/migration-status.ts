import type { DB } from "../db.js";
import { latestMigration } from "../migrate.js";

export async function migrationStatusCommand(db: DB) {
  const status = await latestMigration(db);

  console.log();
  if (status) {
    console.log(`Currently migrated to ${status.id}`);
  } else {
    console.log("Never migrated");
  }
  return 0;
}
