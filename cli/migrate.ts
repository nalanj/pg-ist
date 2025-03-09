import type { DB } from "../db.js";
import { createMigrationCommand } from "./create-migration.js";
import type { CLIOptions } from "./index.js";
import { migrationStatusCommand } from "./migration-status.js";
import { pendingMigrationsCommand } from "./pending-migrations.js";
import { runMigrationsCommand } from "./run-migrations.js";

const migrateSubcommands = {
  create: {
    desc: "Create a new migration",
    fn: createMigrationCommand,
  },
  status: {
    desc: "Show migration status",
    fn: migrationStatusCommand,
  },
  pending: {
    desc: "List pending migrations",
    fn: pendingMigrationsCommand,
  },
  run: {
    desc: "Run all pending migrations",
    fn: runMigrationsCommand,
  },
};

export async function migrateCommand(
  db: DB,
  argv: string[],
  opts: CLIOptions,
  cliName: string,
): Promise<number> {
  const subCommand = argv[1];

  if (subCommand && subCommand in migrateSubcommands) {
    return await migrateSubcommands[
      subCommand as keyof typeof migrateSubcommands
    ].fn(db, argv, opts as CLIOptions, cliName);
  }

  console.log(`Usage: ${cliName} migrate [command]`);
  console.log();
  console.log("Migrate Commands:");
  for (const [name, { desc }] of Object.entries(migrateSubcommands)) {
    console.log(`  ${name} - ${desc}`);
  }

  return 1;
}
