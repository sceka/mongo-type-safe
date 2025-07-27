import z from "zod";
import { validateUpdate } from "../src/util/validate";

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
