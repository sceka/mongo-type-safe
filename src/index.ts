import { Document, Collection, InsertManyResult, InsertOneResult, UpdateOneModel } from "mongodb";
import { Schema, TypeOf, ZodObject, ZodRawShape, ZodSchema } from "zod";
import { singleSentenceError } from "./util/helper";
import z from "zod";

export function createSafeCollection<Shape extends ZodObject<any>>(
	collection: Collection<TypeOf<Shape>>,
	schema: Shape
) {
	return {
		async insertOne(doc: TypeOf<Shape>) {
			const result = schema.safeParse(doc);
			if (!result.success) {
				throw new Error("Validation failed");
			}
			const validatedDoc = result.data as TypeOf<Schema>;
			return await collection.insertOne(validatedDoc);
		},

		async insertMany(doc: TypeOf<Shape>) {
			const result = z.array(schema).safeParse(doc);
			if (!result.success) {
				throw new Error(singleSentenceError(result.error.issues));
			}
		}

        async 

		// 	const validatedDocs = result.data;
		// 	return await collection.insertMany(validatedDocs);
		// }

		// async updateOne(filter: Document, update: unknown): Promise<boolean> {
		//     const result = schema.par
		// }
	};
}
