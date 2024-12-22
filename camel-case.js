export function camelCase(underscored) {
	return underscored.split("_").reduce((acc, cur, idx) => {
		if (idx === 0) {
			return acc + cur.toLowerCase();
		}

		return acc + cur.charAt(0).toUpperCase() + cur.slice(1).toLowerCase();
	}, "");
}
