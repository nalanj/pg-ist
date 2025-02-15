import type pg from "pg";

/**
 * OnlyOneError is thrown when queryExactlyOne is called with a query that
 * returns no rows.
 */
export class OnlyOneError extends Error {
	constructor(m: string) {
		super(m);
		Object.setPrototypeOf(this, OnlyOneError.prototype);
	}
}

/**
 * UniqueConstraintErrors are thrown when a unique constraint fails
 */
export class UniqueConstraintError extends Error {
	constraint;

	constructor(message: string, constraint: string) {
		super(message);
		this.constraint = constraint;

		Object.setPrototypeOf(this, UniqueConstraintError.prototype);
	}

	static fromDBError(error: pg.DatabaseError) {
		if (!error.constraint) {
			throw new Error("Created constraint error without constraint property");
		}

		return new UniqueConstraintError(error.message, error.constraint);
	}
}
