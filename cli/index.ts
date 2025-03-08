import { type ParseArgsConfig, parseArgs } from "node:util";
import type { DB } from "../db.js";
import { migrateCommand } from "./migrate.js";
import { queryCommand } from "./query.js";

export type CLIOptions = {
  typescript: boolean;
};

const options: ParseArgsConfig["options"] = {
  typescript: {
    type: "boolean",
    short: "t",
    default: false,
  },
};

const commands = {
  query: {
    desc: "Run a SQL query",
    fn: queryCommand,
  },
  migrate: {
    desc: "Migration commands",
    fn: migrateCommand,
  },
} as const;

export async function cli(db: DB, cliName: string) {
  const { values: opts, positionals: argv } = parseArgs({
    arguments: process.argv,
    options,
    strict: true,
    allowPositionals: true,
  });

  const command = argv[0];
  if (command && command in commands) {
    return await commands[command as keyof typeof commands].fn(
      db,
      argv,
      opts as CLIOptions,
      cliName,
    );
  }

  console.log(`Usage: ${cliName} [command]`);
  console.log();
  console.log("Commands:");
  for (const [name, { desc }] of Object.entries(commands)) {
    console.log(`  ${name} - ${desc}`);
  }

  return 1;
}
