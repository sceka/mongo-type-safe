import { Collection, MongoClient } from "mongodb";
import { z } from "zod";
import { createSafeCollection } from "../src";

const uri = "mongodb://localhost:27017";

const client = new MongoClient(uri);

async function main() {
	await client.connect();
	const db = client.db("test-db");
	const users: Collection<{ name: string; age?: number }> = db.collection("users");

	const userSchema = z.object({
		name: z.string(),
		age: z.number().optional()
	});

	const safeUsers = createSafeCollection(users, userSchema);

	try {
		await safeUsers.insertOne({ name: "Marko", age: undefined });

		await safeUsers.insertOne({ name: null, age: undefined });
	} catch (err) {
		console.log(err);
	} finally {
		client.close();
	}
}

main();
