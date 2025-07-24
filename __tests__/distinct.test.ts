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

describe("distinct", () => {
	test("returns distinct values for valid field", async () => {
		const distinctAges = await users.distinct("age");
		expect(distinctAges).toEqual([20, 25]);
	});

	test("throws error for invalid field", async () => {
		expect.assertions(2);
		try {
			await users.distinct("notARealField" as any);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toMatch(/^Invalid field/); // Ako validiraš field name
		}
	});
});
