import type { DB } from "../db.js";
import { unsafe } from "../sql.js";
import type { CLIOptions } from "./index.js";

export async function queryCommand(
  db: DB,
  argv: string[],
  opts: CLIOptions,
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
