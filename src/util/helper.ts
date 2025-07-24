import { ZodError, ZodIssue, ZodObject, ZodRawShape } from "zod";

export function formatZodErrors(issues: ZodIssue[]): string {
	return issues
		.map(issue => `Error at field - ${issue.path.join(".")}: ${issue.message}`)
		.join("\n");
}

export function createFilterSchema<T extends ZodObject<ZodRawShape>>(schema: T) {
	return schema.partial();
}
