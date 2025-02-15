import { pgist } from "pg-ist";

export type User = {
	id: number;
	name: string;
};

export type Pet = {
	name: string;
};

export const db = pgist({
	db: {
		connectionString: "postgres://postgres:postgres@127.0.0.1:5432/pgist-test",
		connectionTimeoutMillis: 3000,
	},
});
