import { type ParseArgsConfig, parseArgs } from "node:util";
import type { DB } from "./db.js";
import { unsafe } from "./sql.js";

type CliOptions = {
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
    fn: query,
  },
  migrate: {
    desc: "Migration commands",
    fn: migrate,
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
      opts as CliOptions,
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

async function query(
  db: DB,
  argv: string[],
  opts: CliOptions,
  cliName: string,
) {
  if (!argv[1]) {
    console.log(`Usage: ${cliName} query [sql]`);
    return 1;
  }

  const queryString = unsafe(argv[1]);

  try {
    const cursor = db.cursor(25);
    for await (const row of cursor`${queryString}`) {
      console.log(JSON.stringify(row));
    }
    console.log();
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Error: ${e.message}\n`);
    } else {
      console.error(`Error: ${e}\n`);
    }
  }

  return 0;
}

const migrateSubcommands = {
  create: {
    desc: "Create a new migration",
    fn: createMigrationCommand,
  },
};

async function migrate(
  db: DB,
  argv: string[],
  opts: CliOptions,
  cliName: string,
): Promise<number> {
  const subCommand = argv[1];

  if (subCommand && subCommand in migrateSubcommands) {
    return await migrateSubcommands[
      subCommand as keyof typeof migrateSubcommands
    ].fn(db, argv, opts as CliOptions, cliName);
  }

  console.log(`Usage: ${cliName} migrate [command]`);
  console.log();
  console.log("Migrate Commands:");
  for (const [name, { desc }] of Object.entries(migrateSubcommands)) {
    console.log(`  ${name} - ${desc}`);
  }

  return 1;
}

async function createMigrationCommand(
  db: DB,
  argv: string[],
  opts: CliOptions,
  cliName: string,
) {
  const name = argv[2];

  if (!name) {
    console.log(`Usage: ${cliName} migrate create [--typescript] [name]`);
    return 1;
  }

  console.log(`Creating ${name}`);
  return 0;
}
