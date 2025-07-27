import z, { ZodError, ZodIssue, ZodObject, ZodRawShape, ZodTypeAny } from "zod";
import { AllowedFilterOperator, allowedOperators } from "./types";

export function formatZodErrors(issues: ZodIssue[]): string {
	return issues
		.map(issue => `Error at field - ${issue.path.join(".")}: ${issue.message}`)
		.join("\n");
}

const comparisonOperators = (type: ZodTypeAny) =>
	z
		.object({
			$eq: type.optional(),
			$ne: type.optional(),
			$gt: type.optional(),
			$gte: type.optional(),
			$lt: type.optional(),
			$lte: type.optional(),
			$in: z.array(type).optional(),
			$nin: z.array(type).optional(),
			$regex: z.instanceof(RegExp).optional()
		})
		.optional();

function wrapWithOperators(type: ZodTypeAny): ZodTypeAny {
	return z.union([type, comparisonOperators(type)]);
}

export function createFilterSchema<T extends ZodObject<ZodRawShape>>(schema: T) {
	const shape = schema.shape;
	const newShape: ZodRawShape = {};

	for (const key in shape) {
		newShape[key] = wrapWithOperators(shape[key]);
	}

	// lazy mora biti unutar rekursivnih poziva
	const filterSchema: ZodTypeAny = z.lazy(() =>
		z
			.object({
				...newShape,
				$or: z.array(z.lazy(() => filterSchema)).optional(),
				$and: z.array(z.lazy(() => filterSchema)).optional(),
				$not: z.lazy(() => filterSchema).optional()
			})
			.strict()
	);

	return filterSchema;
}

export function isAllowedOperator(key: string): key is AllowedFilterOperator {
	return allowedOperators.includes(key as AllowedFilterOperator);
}
