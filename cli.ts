import type { DB } from "./db.js";
import { unsafe } from "./sql.js";

export async function cli(db: DB, cliName: string) {
	const argv = process.argv;

	let out = 0;

	if (argv[2] === "query") {
		out = await query(db, argv, cliName);
	}

	return out;
}

async function query(db: DB, argv: string[], cliName: string) {
	if (!argv[3]) {
		console.log(`Usage: ${cliName} query [sql]`);
		return 1;
	}

	const queryString = unsafe(argv[3]);

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
