class SQLQuery {
	strings: string[];
	values: unknown[];

	constructor(strings: string[], values: unknown[]) {
		this.strings = strings;
		this.values = values;
	}

	get text() {
		let out = "";
		this.strings.slice(0, -1).forEach((string, idx) => {
			out += `${string}$${idx + 1}`;
		});

		out += this.strings[this.strings.length - 1];

		return out;
	}
}

export function sql(
	stringsIn: TemplateStringsArray,
	...argsIn: unknown[]
): SQLQuery {
	const values: unknown[] = [];
	const strings: string[] = [];

	if (stringsIn.length === 1 && stringsIn[0]) {
		const firstString = stringsIn[0];

		// short circuit when no args
		return new SQLQuery([firstString], values);
	}

	let outOffset = 0;
	for (let inOffset = 0; inOffset < argsIn.length; inOffset++) {
		const arg = argsIn[inOffset];

		if (arg instanceof SQLQuery) {
			// merge the opening string of the query arg into the previous string
			strings[outOffset] = strings[outOffset]
				? strings[outOffset] + (stringsIn[inOffset] ?? "") + arg.strings[0]
				: stringsIn[inOffset] + (arg.strings[0] ?? "");

			strings.splice(outOffset + 1, 0, ...arg.strings.slice(1));
			values.splice(outOffset, 0, ...arg.values);
			outOffset += arg.strings.length - 1;
		} else {
			strings[outOffset] = strings[outOffset]
				? strings[outOffset] + (stringsIn[inOffset] ?? "")
				: (stringsIn[inOffset] ?? "");

			values[outOffset] = arg;
			outOffset += 1;
		}

		// append the last string
		if (inOffset === argsIn.length - 1) {
			strings[outOffset] = strings[outOffset]
				? strings[outOffset] + (stringsIn[inOffset + 1] ?? "")
				: (stringsIn[inOffset + 1] ?? "");
		}
	}

	return new SQLQuery(strings, values);
}

export function unsafe(unsafeString: string): SQLQuery {
	return new SQLQuery([unsafeString], []);
}
