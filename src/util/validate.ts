import { object, TypeOf, ZodError, ZodObject, ZodRawShape, ZodSchema } from "zod";
import { createFilterSchema, formatZodErrors, isAllowedOperator } from "./helper";
import { SafeUpdate } from "./types";

export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
	try {
		return schema.parse(data);
	} catch (err) {
		if (err instanceof ZodError) {
			const message = formatZodErrors(err.issues);
			throw new Error(message);
		}

		throw err;
	}
}

export function validateFilterOperators(filter: any): void {
	if (!filter || typeof filter !== "object") return;

	for (const key in filter) {
		if (key.startsWith("$")) {
			if (!isAllowedOperator(key)) {
				throw new Error(`Invalid filter operator: ${key}`);
			}
		}

		const value = filter[key];

		if (typeof value === "object" && value !== null) {
			return validateFilterOperators(value);
		}
	}
}

export function validateFilter<T extends ZodObject<ZodRawShape>>(filter: any, schema: T) {
	if (!filter || typeof filter !== "object") return;

	validateFilterOperators(filter);

	const filterSchema = createFilterSchema(schema);
	const parsed = filterSchema.safeParse(filter);
	if (!parsed.success) {
		throw new Error("Invalid filter: " + parsed.error.message);
	}
	return filter;
}

export function validateUpdate<T extends ZodObject<ZodRawShape>>(
	update: SafeUpdate<TypeOf<T>>,
	schema: T
) {
	if (!update || typeof update !== "object") return;

	const shape = schema.shape;

	if (update.$set) {
		const result = schema.partial().safeParse(update.$set);
		if (!result.success) {
			throw new Error(`Invalid $set update: ${result.error.message}`);
		}
	}

	if (update.$setOnInsert) {
		const result = schema.partial().safeParse(update.$setOnInsert);
		if (!result.success) {
			throw new Error(`Invalid $setOnInsert update: ${result.error.message}`);
		}
	}

	if (update.$unset) {
		const keys = Object.keys(update.$unset);
		const allowed = Object.keys(shape);

		for (const key of keys) {
			if (!allowed.includes(key)) {
				throw new Error(`Invalid $unset key: ${key}`);
			}
		}
	}

	for (const op of ["$inc", "$min", "$max"] as const) {
		if (update[op]) {
			for (const key in update[op]) {
				const field = shape[key];
				if (!field) {
					throw new Error(`Invalid $inc key: ${key}, field not found in schema`);
				}

				let base = field;

				while (
					base._def.typeName === "ZodOptional" ||
					base._def.typeName === "ZodNullable"
				) {
					base = base._def.innerType;
				}

				if (base._def.typeName !== "ZodNumber") {
					throw new Error(`Invalid $inc key: ${key}, not a number field`);
				}
			}
		}
	}
}
