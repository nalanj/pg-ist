const SQL = Symbol("SQL");

export type SQL = {
	[SQL]: true;
	strings: string[];
	values: unknown[];
	text: string;
};

function isSQL(arg: unknown): arg is SQL {
	return (arg as SQL)[SQL] === true;
}

export function sql(
	stringsIn: TemplateStringsArray,
	...argsIn: unknown[]
): SQL {
	const values: unknown[] = [];
	const strings: string[] = [];

	if (stringsIn.length === 1 && stringsIn[0]) {
		const firstString = stringsIn[0];

		// short circuit when no args
		return {
			[SQL]: true,
			strings: [firstString],
			values,
			get text(): string {
				return firstString;
			},
		};
	}

	let outOffset = 0;
	for (let inOffset = 0; inOffset < argsIn.length; inOffset++) {
		const arg = argsIn[inOffset];

		if (isSQL(arg)) {
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

	return {
		[SQL]: true,
		strings,
		values,
		get text() {
			return queryText(strings);
		},
	};
}

function queryText(strings: string[]) {
	let out = "";
	strings.slice(0, -1).forEach((string, idx) => {
		out += `${string}$${idx + 1}`;
	});

	out += strings[strings.length - 1];

	return out;
}

export function unsafe(unsafeString: string): SQL {
	return {
		[SQL]: true,
		strings: [unsafeString],
		values: [],
		get text() {
			return unsafeString;
		},
	};
}
