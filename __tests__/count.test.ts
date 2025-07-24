import z from "zod";
import { createSafeCollection } from "../src";
import { MongoClient } from "mongodb";

const userSchema = z.object({
	name: z.string(),
	age: z.number().optional()
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
	await rawCollection.deleteMany({});
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

describe("Count operations", () => {
	test("countDocuments returns correct count for valid documents", async () => {
		const count = await users.countDocuments({ age: 25 });
		expect(count).toBe(2);
	});

	test("countDocuments rejects invalid filter", async () => {
		expect.assertions(2);

		try {
			await users.countDocuments({ age: "invalid" } as any);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toMatch(/^Invalid filter:/);
		}
	});

	test("countDocuments returns total document count", async () => {
		const count = await users.countDocuments({});
		expect(count).toBe(3);
	});
});

describe("estimatedDocumentCount", () => {
	beforeEach(async () => {
		await users.deleteMany({});
	});

	test("returns 0 for empty collection", async () => {
		const count = await users.estimatedDocumentCount();
		expect(count).toBe(0);
	});

	test("returns correct count after insertions", async () => {
		await users.insertMany([
			{ name: "Marko", age: 22 },
			{ name: "Ana", age: 30 }
		]);

		const count = await users.estimatedDocumentCount();
		expect(count).toBe(2);
	});
});
