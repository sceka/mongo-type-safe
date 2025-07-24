import { TypeOf, ZodError, ZodObject, ZodRawShape, ZodSchema } from "zod";
import { createFilterSchema, formatZodErrors } from "./helper";

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

export function validateFilter<T extends ZodObject<ZodRawShape>>(filter: any, schema: T) {
	const filterSchema = createFilterSchema(schema);
	const parsed = filterSchema.safeParse(filter);
	if (!parsed.success) {
		throw new Error("Invalid filter: " + parsed.error.message);
	}
	return filter;
}
