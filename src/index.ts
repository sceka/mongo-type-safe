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
	AggregateOptions,
	FindOneAndDeleteOptions,
	CountDocumentsOptions,
	EstimatedDocumentCountOptions
} from "mongodb";
import { ZodObject } from "zod";
import type { Schema, TypeOf } from "zod";
import { validateFilter, validateOrThrow } from "./util/validate";

type StrictFilter<T> = {
	[P in keyof T]?: T[P] extends object ? StrictFilter<T[P]> : T[P];
};

export function createSafeCollection<TSchema extends ZodObject<any>>(
	collection: Collection<TypeOf<TSchema>>,
	schema: TSchema
) {
	return {
		/**
		 * Inserts a single document into the collection.
		 */
		insertOne(doc: OptionalUnlessRequiredId<TypeOf<TSchema>>, options?: InsertOneOptions) {
			validateOrThrow(schema, doc);
			return collection.insertOne(doc, options);
		},

		/**
		 * Inserts multiple documents into the collection.
		 */
		insertMany(docs: OptionalUnlessRequiredId<TypeOf<TSchema>>[]) {
			docs.forEach(doc => validateOrThrow(schema, doc));
			return collection.insertMany(docs);
		},

		/**
		 * Updates a single document matching the filter.
		 */
		updateOne(
			filter: StrictFilter<TypeOf<TSchema>>,
			update: UpdateFilter<TypeOf<TSchema>>,
			options?: UpdateOptions
		) {
			validateFilter(filter, schema);
			return collection.updateOne(filter, update, options);
		},

		/**
		 * Updates a single document matching the filter and returns it (before or after update).
		 */
		findOneAndUpdate(
			filter: StrictFilter<TypeOf<TSchema>>,
			update: UpdateFilter<TypeOf<TSchema>>,
			options?: FindOneAndUpdateOptions
		) {
			validateFilter(filter, schema);
			return options
				? collection.findOneAndUpdate(filter, update, options)
				: collection.findOneAndUpdate(filter, update);
		},

		/**
		 * Updates multiple documents matching the filter.
		 */
		updateMany(
			filter: StrictFilter<TypeOf<TSchema>>,
			update: UpdateFilter<TypeOf<TSchema>>,
			options?: UpdateOptions
		) {
			validateFilter(filter, schema);
			return collection.updateMany(filter, update, options);
		},

		/**
		 * Finds a single document matching the filter.
		 */
		findOne(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			validateFilter(filter, schema);
			return collection.findOne(filter, options);
		},

		/**
		 * Finds all documents matching the filter.
		 */
		find(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			validateFilter(filter, schema);
			return collection.find(filter, options);
		},

		/**
		 * Deletes a single document matching the filter.
		 */
		deleteOne(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			validateFilter(filter, schema);
			return collection.deleteOne(filter, options);
		},

		/**
		 * Deletes multiple documents matching the filter.
		 */
		deleteMany(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			validateFilter(filter, schema);
			return collection.deleteMany(filter, options);
		},

		/**
		 * Deletes a single document matching the filter and returns it.
		 */
		findOneAndDelete(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOneAndDeleteOptions) {
			validateFilter(filter, schema);
			return options
				? collection.findOneAndDelete(filter, options)
				: collection.findOneAndDelete(filter);
		},

		/**
		 * Replaces a single document matching the filter with a new document.
		 */
		replaceOne(
			filter: StrictFilter<TypeOf<TSchema>>,
			newDocument: TypeOf<TSchema>,
			options?: ReplaceOptions
		) {
			validateFilter(filter, schema);
			validateOrThrow(schema, newDocument);
			return collection.replaceOne(filter, newDocument, options);
		},

		/**
		 * Finds a single document matching the filter, replaces it with a new document, and returns it.
		 */
		findOneAndReplace(
			filter: StrictFilter<TypeOf<TSchema>>,
			newDocument: TypeOf<TSchema>,
			options?: FindOneAndReplaceOptions
		) {
			validateFilter(filter, schema);
			validateOrThrow(schema, newDocument);
			return options
				? collection.findOneAndReplace(filter, newDocument, options)
				: collection.findOneAndReplace(filter, newDocument);
		},

		/**
		 * Runs an aggregation pipeline on the collection.
		 * @template TResult The expected result type of the aggregation.
		 */
		aggregate<TResult extends Document = TypeOf<TSchema> & Document>(
			pipeline: object[],
			options?: AggregateOptions
		) {
			return collection.aggregate<TResult>(pipeline, options);
		},

		/**
		 * Counts the number of documents matching the filter.
		 */
		countDocuments(filter?: StrictFilter<TypeOf<TSchema>>, options?: CountDocumentsOptions) {
			if (filter) validateFilter(filter, schema);
			return collection.countDocuments(filter, options);
		},

		/**
		 * Returns the estimated number of documents in the collection.
		 */
		estimatedDocumentCount(options?: EstimatedDocumentCountOptions) {
			return collection.estimatedDocumentCount(options);
		},

		/**
		 * Returns an array of distinct values for the given field across a single collection.
		 */
		distinct<Key extends keyof TypeOf<TSchema>>(
			key: Key,
			filter?: StrictFilter<TypeOf<TSchema>>
		) {
			if (!(key in schema.shape)) {
				throw new Error(`Invalid field: ${String(key)}`);
			}

			if (filter) validateFilter(filter, schema);
			return filter
				? collection.distinct(key as string, filter)
				: collection.distinct(key as string);
		}
	};
}
