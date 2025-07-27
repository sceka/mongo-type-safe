import z from "zod";
import { validateFilter, validateFilterOperators, validateUpdate } from "../src/util/validate";

const schema = z.object({
	name: z.string(),
	age: z.number().optional()
});

describe("validateUpdate", () => {
	it("should allow valid $set", () => {
		expect(() => validateUpdate({ $set: { name: "John" } }, schema)).not.toThrow();
	});

	it("should throw on invalid $set", () => {
		expect(() => validateUpdate({ $set: { age: "not a number" as any } }, schema)).toThrow();
	});

	it("should allow valid $unset", () => {
		expect(() => validateUpdate({ $unset: { name: "" } }, schema)).not.toThrow();
	});

	it("should throw on invalid $unset key", () => {
		expect(() =>
			validateUpdate({ $unset: { unknownField: "unkownField" as any } }, schema)
		).toThrow();
	});

	it("should allow valid $inc", () => {
		expect(() => validateUpdate({ $inc: { age: 1 } }, schema)).not.toThrow();
	});

	it("should throw on $inc for non-number", () => {
		expect(() => validateUpdate({ $inc: { name: 1 as any } }, schema)).toThrow();
	});

	it("should allow valid $setOnInsert", () => {
		expect(() => validateUpdate({ $setOnInsert: { name: "New User" } }, schema)).not.toThrow();
	});

	it("should throw on invalid $setOnInsert", () => {
		expect(() =>
			validateUpdate({ $setOnInsert: { age: "invallid" as any } }, schema)
		).toThrow();
	});

	it("should allow valid $min", () => {
		expect(() => validateUpdate({ $min: { age: 12 } }, schema)).not.toThrow();
	});

	it("should throw on invalid $min", () => {
		expect(() => validateUpdate({ $min: { name: 12 as any } }, schema)).toThrow();
	});

	it("should allow valid $max", () => {
		expect(() => validateUpdate({ $max: { age: 12 } }, schema)).not.toThrow();
	});

	it("should throw on invalid $max", () => {
		expect(() => validateUpdate({ $max: { name: 12 as any } }, schema)).toThrow();
	});
});

describe("validateFilterOptions", () => {
	it("should allow valid operators", () => {
		expect(() => validateFilterOperators({ $or: [{ age: { $gte: 18 } }] })).not.toThrow();
	});

	it("should throw on invalid operator", () => {
		expect(() => validateFilterOperators({ $foo: { name: 12 } }));
	});
});

describe("validateFilter", () => {
	it("accepts valid filter", () => {
		expect(() =>
			validateFilter({ name: { $eq: "Marko" }, age: { $gt: 18 } }, schema)
		).not.toThrow();
	});

	it("rejects filter with wrong types", () => {
		expect(() => validateFilter({ name: { $eq: 123 } }, schema)).toThrow();
	});

	it("accepts direct value without operators", () => {
		expect(() => validateFilter({ name: "Marko" }, schema)).not.toThrow();
	});

	it("accepts mix of direct values and operators", () => {
		expect(() => validateFilter({ name: "Marko", age: { $gte: 21 } }, schema)).not.toThrow();
	});

	it("accepts $in and $nin with array of valid values", () => {
		expect(() => validateFilter({ age: { $in: [20, 30, 40] } }, schema)).not.toThrow();

		expect(() => validateFilter({ age: { $nin: [15, 18] } }, schema)).not.toThrow();
	});

	it("rejects $in and $nin with invalid value types", () => {
		expect(() => validateFilter({ age: { $in: [20, "thirty", 40] } }, schema)).toThrow();

		expect(() => validateFilter({ age: { $nin: ["fifteen", 18] } }, schema)).toThrow();
	});

	it("accepts $regex operator with RegExp instance", () => {
		expect(() => validateFilter({ name: { $regex: /Marko/i } }, schema)).not.toThrow();
	});

	it("rejects $regex with invalid type", () => {
		expect(() => validateFilter({ name: { $regex: "Marko" } }, schema)).toThrow();
	});

	it("accepts $or, $and, and $not with valid filters", () => {
		expect(() =>
			validateFilter({ $or: [{ name: "Marko" }, { age: { $lt: 30 } }] }, schema)
		).not.toThrow();

		expect(() =>
			validateFilter({ $and: [{ name: { $ne: "Ana" } }, { age: { $gte: 18 } }] }, schema)
		).not.toThrow();

		expect(() => validateFilter({ $not: { age: { $lt: 18 } } }, schema)).not.toThrow();
	});

	it("rejects filters with unknown fields", () => {
		expect(() => validateFilter({ unknownField: "value" }, schema)).toThrow();
	});
});
