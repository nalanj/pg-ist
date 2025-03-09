export default async function up(db) {
  await db.query`CREATE TABLE orgs (id SERIAL PRIMARY KEY, name TEXT NOT NULL)`;
}
