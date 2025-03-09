import type { DB } from "../db.js";
import { createMigration } from "../migrate.js";
import type { CLIOptions } from "./index.js";

export async function createMigrationCommand(
  db: DB,
  argv: string[],
  opts: CLIOptions,
  cliName: string,
) {
  const name = argv[2];

  if (!name) {
    console.log(`Usage: ${cliName} migrate create [--typescript] [name]`);
    return 1;
  }

  const migrationsDir = db.config.migrationsDir;
  if (!migrationsDir) {
    console.error("migrationsDir configuration is not set");
    return 1;
  }

  const created = await createMigration(migrationsDir, name, opts.typescript);
  if (!created) {
    console.error("Cannot create migration");
    return 1;
  }

  console.log();
  console.log(`Created migration ${created}`);
  return 0;
}
