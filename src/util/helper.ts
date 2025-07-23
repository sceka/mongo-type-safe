import { ZodError, ZodIssue } from "zod";

export function formatZodErrors(issues: ZodIssue[]): string {
	return issues
		.map(issue => `Error at field - ${issue.path.join(".")}: ${issue.message}`)
		.join("\n");
}
