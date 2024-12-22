export class SQLQuery {
	values;
	strings;

	constructor(strings, argsIn) {
		this.values = [];
		this.strings = [];

		// short circuit when no args
		if (strings.length === 1 && strings[0]) {
			this.strings[0] = strings[0];
			return;
		}

		let outOffset = 0;
		for (let inOffset = 0; inOffset < argsIn.length; inOffset++) {
			const arg = argsIn[inOffset];

			if (arg instanceof SQLQuery) {
				// merge the opening string of the query arg into the previous string
				this.strings[outOffset] = this.strings[outOffset]
					? this.strings[outOffset] + (strings[inOffset] ?? "") + arg.strings[0]
					: strings[inOffset] + (arg.strings[0] ?? "");

				this.strings.splice(outOffset + 1, 0, ...arg.strings.slice(1));
				this.values.splice(outOffset, 0, ...arg.values);
				outOffset += arg.strings.length - 1;
			} else {
				this.strings[outOffset] = this.strings[outOffset]
					? this.strings[outOffset] + (strings[inOffset] ?? "")
					: (strings[inOffset] ?? "");

				this.values[outOffset] = arg;
				outOffset += 1;
			}

			// append the last string
			if (inOffset === argsIn.length - 1) {
				this.strings[outOffset] = this.strings[outOffset]
					? this.strings[outOffset] + (strings[inOffset + 1] ?? "")
					: (strings[inOffset + 1] ?? "");
			}
		}
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

/**
 * Process the given query template
 *
 * @param strings - strings to use for the template
 * @param argsIn - arguments for the template
 * @returns - a Query object
 */
export function sql(strings, ...argsIn) {
	return new SQLQuery(strings, argsIn);
}

export function unsafe(unsafeString) {
	return new SQLQuery([unsafeString]);
}
