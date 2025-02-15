import { type Pet, type User, db } from "./db.ts";

const name = "Alan";
const age = 44;

const pets = [{ name: "Carmen" }, { name: "Alberta" }, { name: "Dewey" }];

const result = await db.tx(async (tx) => {
	const user = await tx.one<User>`
    INSERT INTO users (name, age) 
    VALUES (${name}, ${age})
    RETURNING *
  `;

	const pets: Pet[] = [];
	for (const pet of pets) {
		pets.push(await tx.onlyOne`INSERT INTO pets (name) VALUES (${name})`);
	}

	return { human: user, pets };
});
