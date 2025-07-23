import { TypeOf, ZodError, ZodObject, ZodSchema } from "zod";
import { formatZodErrors } from "./helper";

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
