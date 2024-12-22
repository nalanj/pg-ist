/**
 * Process the given query template
 *
 * @param strings - strings to use for the template
 * @param argsIn - arguments for the template
 * @returns - a Query object
 */
export function sql(stringsIn, ...argsIn) {
	const values = [];
	const strings = [];

	if (stringsIn.length === 1 && stringsIn[0]) {
		// short circuit when no args
		return {
			isSQL: true,
			strings: [stringsIn[0]],
			values,
			text: () => stringsIn[0],
		};
	}

	let outOffset = 0;
	for (let inOffset = 0; inOffset < argsIn.length; inOffset++) {
		const arg = argsIn[inOffset];

		if (arg.isSQL) {
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
		isSQL: true,
		strings,
		values,
		get text() {
			return queryText(strings);
		},
	};
}

function queryText(strings) {
	let out = "";
	strings.slice(0, -1).forEach((string, idx) => {
		out += `${string}$${idx + 1}`;
	});

	out += strings[strings.length - 1];

	return out;
}

export function unsafe(unsafeString) {
	return sql([unsafeString]);
}
