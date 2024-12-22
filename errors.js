/**
 * ExactlyOneErrors are thrown when queryExactlyOne is called with a query that
 * returns no rows.
 */
export class ExactlyOneError extends Error {}

/**
 * UniqueConstraintErrors are thrown when a unique constraint fails
 */
export class UniqueConstraintError extends Error {
	constraint;

	constructor(message, constraint) {
		super(message);
		this.constraint = constraint;
	}

	static fromDBError(error) {
		if (!error.constraint) {
			throw new Error("Created constraint error without constraint property");
		}

		return new UniqueConstraintError(error.message, error.constraint);
	}
}
