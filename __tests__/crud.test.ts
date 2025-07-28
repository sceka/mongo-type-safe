import { Collection, MongoClient } from "mongodb";
import z from "zod";
import { createSafeCollection } from "../src/index";
import { ZodError } from "zod/v4";
import { createFilterSchema } from "../src/util/helper";

const userSchema = z.object({
	name: z.string(),
	age: z.number().optional()
});

type User = z.infer<typeof userSchema>;

jest.setTimeout(15000);

let client: MongoClient;
let users: ReturnType<typeof createSafeCollection<typeof userSchema>>;
let rawCollection: Collection<User>;

beforeAll(async () => {
	client = new MongoClient("mongodb://localhost:27017");
	await client.connect();
	const db = client.db("test-db");
	rawCollection = db.collection<User>("users");
	users = createSafeCollection(rawCollection, userSchema);
	await rawCollection.deleteMany({});
});

afterAll(async () => {
	await client.close();
});

test("insertOne inserts valid document", async () => {
	const result = await users.insertOne({ name: "Marko", age: 12 });
	expect(result.insertedId).toBeDefined();
});

test("insertOne rejects invalid document and shows error", async () => {
	try {
		await users.insertOne({ name: 22 as any, age: 22 });
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toMatch(/Expected string/);
	}
});

test("insertMany inserts many valid document", async () => {
	const docs = [
		{
			name: "Ana",
			age: 22
		},
		{
			name: "Petar",
			age: 24
		}
	];
	const result = await users.insertMany(docs);
	expect(result.insertedCount).toBe(2);

	const insertedDocs = await users.find({}).toArray();
	const names = insertedDocs.map(a => a.name);
	expect(names).toEqual(expect.arrayContaining(["Ana", "Petar"]));
});

test("insertMany rejects invalid documents with correct error message", async () => {
	try {
		users.insertMany([
			{ name: "Valid User", age: 30 },
			{ name: 123 as any, age: 25 } // invalid
		]);
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toMatch(/Expected string/);
	}
});

test("findOne returns inserted document", async () => {
	const doc = await users.findOne({ name: "Marko" });
	expect(doc?.age).toBe(12);
});

test("find returns multiple matching documents", async () => {
	await users.insertMany([
		{ name: "ValidDoc", age: 22 },
		{ name: "ValidDoc1", age: 23 }
	]);

	const result = await users.find({}).toArray();

	expect(result.length).toBeGreaterThanOrEqual(2);
	expect(result[0]).toHaveProperty("age");
});

test("filter schema rejects unknown fields", () => {
	const userSchema = z.object({
		name: z.string(),
		age: z.number()
	});

	const filterSchema = createFilterSchema(userSchema);

	expect(() => filterSchema.parse({ unknownField: "something" })).toThrow(
		/Unrecognized key\(s\) in object/
	);
});

test("find rejects filter with invalid field", async () => {
	try {
		users.find({ age: "twenty-two" } as any).toArray();
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toMatch(/^Invalid filter:/);
	}
});

test("updateOne modifies the document", async () => {
	const res = await users.updateOne({ name: "Marko" }, { $set: { age: 22 } });
	expect(res.modifiedCount).toBe(1);
});

test("updateOne does nothing if no match", async () => {
	const res = await users.updateOne({ name: "NonExistent" }, { $set: { age: 50 } });
	expect(res.modifiedCount).toBe(0);
});

test("deleteOne remove the document", async () => {
	const res = await users.deleteOne({ name: "Marko" });
	expect(res.deletedCount).toBe(1);
});

test("deleteOne does nothing if no match", async () => {
	const res = await users.deleteOne({ name: "NonExistent" });
	expect(res.deletedCount).toBe(0);
});

test("deleteOne rejects filter with invalid field", async () => {
	try {
		users.deleteOne({ age: "invalid" } as any);
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toMatch(/^Invalid filter:/);
	}
});

test("deleteMany rejects filter with invalid field", async () => {
	try {
		await users.deleteMany({ age: "invalid" } as any);
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toMatch(/^Invalid filter:/);
	}
});

test("replaceOne replaces document with valid document", async () => {
	await users.insertOne({ name: "ReplaceMe", age: 30 });
	const res = await users.replaceOne({ name: "ReplaceMe" }, { name: "Replaced", age: 31 });
	expect(res.modifiedCount).toBe(1);

	const doc = await users.findOne({ name: "Replaced" });
	expect(doc?.age).toBe(31);
});

test("findOneAndReplace replaces document with valid document", async () => {
	await users.insertOne({ name: "FindReplace", age: 40 });
	const res = await users.findOneAndReplace(
		{ name: "FindReplace" },
		{ name: "ReplacedAgain", age: 41 },
		{ returnDocument: "after" }
	);
	expect(res?.name).toBe("ReplacedAgain");
});

describe("strict = false (runtime validation disabled)", () => {
	let usersNotStrict: ReturnType<typeof createSafeCollection<typeof userSchema>>;

	beforeAll(() => {
		usersNotStrict = createSafeCollection(rawCollection, userSchema, { strict: false });
	});

	test("insertOne allows invalid document", async () => {
		const invalidDoc = { name: 12345 as any, age: "invalid" as any };
		const res = await usersNotStrict.insertOne(invalidDoc);
		expect(res).toBeDefined();
	});

	test("insertMany inserts many invalid documents", async () => {
		const docs = [
			{ name: 27 as any, age: "invalid" as any },
			{ name: 28 as any, age: "invalid" as any }
		];

		const result = await usersNotStrict.insertMany(docs);
		expect(result.insertedCount).toBe(2);

		const insertedDocs = await usersNotStrict.find({}).toArray();
		const names = insertedDocs.map(d => d.name);
		expect(names).toEqual(expect.arrayContaining([27, 28]));
	});

	test("updateOne allows invalid document", async () => {
		const res = await usersNotStrict.updateOne(
			{ name: "any" },
			{ $set: { age: "123" as any } }
		);

		expect(res).toBeDefined();
	});

	test("updateMany modifies multiple invalid documents", async () => {
		await usersNotStrict.insertMany([
			{ name: "UpdateTest1", age: 20 },
			{ name: "UpdateTest2", age: 25 }
		]);

		const res = await usersNotStrict.updateMany(
			{ age: { $gte: 20 } },
			{ $set: { age: "Hello" as any } }
		);

		expect(res.modifiedCount).toBeGreaterThanOrEqual(1);

		const updatedDocs = await usersNotStrict.find({ age: "Hello" as any }).toArray();
		expect(updatedDocs.length).toBeGreaterThanOrEqual(2);
	});

	test("find allows invalid filter", async () => {
		const cursor = usersNotStrict.find({ age: "invalid" as any });
		const results = await cursor.toArray();
		expect(Array.isArray(results)).toBe(true);
	});

	test("findOne allows invalid filter", async () => {
		const res = await usersNotStrict.findOne({ age: "invalid" as any });
		expect(res).toBeDefined();
	});

	test("deleteOne allows invalid filter", async () => {
		const res = await usersNotStrict.deleteOne({ age: "invalid" as any });
		expect(res).toBeDefined();
	});

	test("deleteMany allows invalid filter", async () => {
		const res = await usersNotStrict.deleteMany({ age: "invalid" as any });
		expect(res).toBeDefined();
	});

	test("replaceOne allows invalid filter and document", async () => {
		const res = await usersNotStrict.replaceOne(
			{ name: 123 as any },
			{ name: 456 as any, age: "invalid" as any }
		);
		expect(res).toBeDefined();
	});

	test("findOneAndReplace replaces document with invalid document", async () => {
		await usersNotStrict.insertOne({ name: "ReplaceMeAgain", age: 40 });

		const res = await usersNotStrict.findOneAndReplace(
			{ name: "ReplaceMeAgain" },
			{ name: 21 as any, age: 41 },
			{ returnDocument: "after" }
		);

		expect(res?.name).toBe(21);

		const doc = await usersNotStrict.findOne({ name: 21 as any });
		expect(doc?.age).toBe(41);
	});
});
