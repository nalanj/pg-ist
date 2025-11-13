import { db, type Pet, type User } from "./db.ts";

const name = "Alan";
const age = 44;

const petsToSave = [{ name: "Carmen" }, { name: "Alberta" }, { name: "Dewey" }];

const result = await db.tx(async (tx) => {
  const user = await tx.one<User>`
    INSERT INTO users (name, age) 
    VALUES (${name}, ${age})
    RETURNING *
  `;

  const pets: Pet[] = [];
  for (const pet of petsToSave) {
    pets.push(await tx.onlyOne`INSERT INTO pets (name) VALUES (${pet.name})`);
  }

  return { human: user, pets };
});

console.log(result);
