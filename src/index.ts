import {
	Collection,
	InsertOneOptions,
	UpdateOptions,
	OptionalUnlessRequiredId,
	Filter,
	UpdateFilter,
	FindOptions,
	FindOneAndReplaceOptions,
	ReplaceOptions,
	FindOneAndUpdateOptions,
	AggregateOptions
} from "mongodb";
import { ZodObject } from "zod";
import type { Schema, TypeOf } from "zod";

type StrictFilter<T> = {
	[P in keyof T]?: T[P] extends object ? StrictFilter<T[P]> : T[P];
};

export function createSafeCollection<TSchema extends ZodObject<any>>(
	collection: Collection<TypeOf<TSchema>>,
	schema: TSchema
) {
	return {
		insertOne(doc: OptionalUnlessRequiredId<TypeOf<TSchema>>, options?: InsertOneOptions) {
			return collection.insertOne(doc, options);
		},

		insertMany(docs: OptionalUnlessRequiredId<TypeOf<TSchema>>[]) {
			return collection.insertMany(docs);
		},

		updateOne(
			filter: StrictFilter<TypeOf<TSchema>>,
			update: UpdateFilter<TypeOf<TSchema>>,
			options?: UpdateOptions
		) {
			return collection.updateOne(filter, update, options);
		},

		findOneAndUpdate(
			filter: StrictFilter<TypeOf<TSchema>>,
			update: UpdateFilter<TypeOf<TSchema>>,
			options?: FindOneAndUpdateOptions
		) {
			return options
				? collection.findOneAndUpdate(filter, update, options)
				: collection.findOneAndUpdate(filter, update);
		},

		updateMany(
			filter: StrictFilter<TypeOf<TSchema>>,
			update: UpdateFilter<TypeOf<TSchema>>,
			options?: UpdateOptions
		) {
			return collection.updateMany(filter, update, options);
		},

		findOne(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			return collection.findOne(filter, options);
		},

		find(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			return collection.find(filter, options);
		},

		deleteOne(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			return collection.deleteOne(filter, options);
		},

		deleteMany(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			return collection.deleteMany(filter, options);
		},

		replaceOne(
			filter: StrictFilter<TypeOf<TSchema>>,
			newDocument: TypeOf<TSchema>,
			options?: ReplaceOptions
		) {
			return collection.replaceOne(filter, newDocument, options);
		},

		findOneAndReplace(
			filter: StrictFilter<TypeOf<TSchema>>,
			newDocument: TypeOf<TSchema>,
			options?: FindOneAndReplaceOptions
		) {
			return options
				? collection.findOneAndReplace(filter, newDocument, options)
				: collection.findOneAndReplace(filter, newDocument);
		},

		aggregate<TResult extends Document = TypeOf<TSchema> & Document>(
			pipeline: object[],
			options?: AggregateOptions
		) {
			return collection.aggregate<TResult>(pipeline, options);
		}
	};
}
