import { MongoClient } from "mongodb";
import { createSafeCollection } from "../src";
import z from "zod";

const userSchema = z.object({
	name: z.string(),
	age: z.number()
});

type User = z.infer<typeof userSchema>;

let client: MongoClient;
let users: ReturnType<typeof createSafeCollection<typeof userSchema>>;

beforeAll(async () => {
	client = new MongoClient("mongodb://localhost:27017");
	await client.connect();
	const db = client.db("test-db");
	const rawCollection = db.collection<User>("users");
	users = createSafeCollection(rawCollection, userSchema);
});

beforeEach(async () => {
	await users.deleteMany({});
	await users.insertMany([
		{ name: "Ana", age: 25 },
		{ name: "Marko", age: 25 },
		{ name: "Luka", age: 20 }
	]);
});

afterAll(async () => {
	await client.close();
});

describe("aggregate", () => {
	test("returns aggregation result", async () => {
		const result = await users
			.aggregate([{ $group: { _id: "$age", count: { $sum: 1 } } }])
			.toArray();

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ _id: 25, count: 2 }),
				expect.objectContaining({ _id: 20, count: 1 })
			])
		);
	});

	test("throws if pipeline is invalid", async () => {
		expect.assertions(2);
		try {
			await users.aggregate([{ $invalidStage: {} }] as any).toArray();
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toMatch(/.*\$invalidStage.*/);
		}
	});
});
