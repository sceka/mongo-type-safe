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
import { validateFilter, validateOrThrow, validateUpdate } from "./util/validate";
import { CreateSafeCollectionOptions, SafeUpdate, TypedFilter } from "./util/types";

type StrictFilter<T> = {
	[P in keyof T]?: T[P] extends object ? StrictFilter<T[P]> : T[P];
};

export function createSafeCollection<TSchema extends ZodObject<any>>(
	collection: Collection<TypeOf<TSchema>>,
	schema: TSchema,
	{ strict = true }: CreateSafeCollectionOptions = {}
) {
	return {
		/**
		 * Inserts a single document into the collection.
		 */
		insertOne(doc: OptionalUnlessRequiredId<TypeOf<TSchema>>, options?: InsertOneOptions) {
			if (strict) validateOrThrow(schema, doc);
			return collection.insertOne(doc, options);
		},

		/**
		 * Inserts multiple documents into the collection.
		 */
		insertMany(docs: OptionalUnlessRequiredId<TypeOf<TSchema>>[]) {
			if (strict) docs.forEach(doc => validateOrThrow(schema, doc));
			return collection.insertMany(docs);
		},

		/**
		 * Updates a single document matching the filter.
		 */
		updateOne(
			filter: TypedFilter<TypeOf<TSchema>>,
			update: SafeUpdate<TypeOf<TSchema>>,
			options?: UpdateOptions
		) {
			if (strict) {
				validateFilter(filter, schema);
				validateUpdate(update, schema);
			}

			return collection.updateOne(filter as Filter<TypeOf<TSchema>>, update, options);
		},

		/**
		 * Updates a single document matching the filter and returns it (before or after update).
		 */
		findOneAndUpdate(
			filter: TypedFilter<TypeOf<TSchema>>,
			update: SafeUpdate<TypeOf<TSchema>>,
			options?: FindOneAndUpdateOptions
		) {
			if (strict) {
				validateFilter(filter, schema);
				validateUpdate(update, schema);
			}

			return options
				? collection.findOneAndUpdate(filter as Filter<TypeOf<TSchema>>, update, options)
				: collection.findOneAndUpdate(filter as Filter<TypeOf<TSchema>>, update);
		},

		/**
		 * Updates multiple documents matching the filter.
		 */
		updateMany(
			filter: TypedFilter<TypeOf<TSchema>>,
			update: SafeUpdate<TypeOf<TSchema>>,
			options?: UpdateOptions
		) {
			if (strict) {
				validateFilter(filter, schema);
				validateUpdate(update, schema);
			}
			return collection.updateMany(filter as Filter<TypeOf<TSchema>>, update, options);
		},

		/**
		 * Finds a single document matching the filter.
		 */
		findOne(filter: TypedFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			if (strict) validateFilter(filter, schema);
			return collection.findOne(filter as Filter<TypeOf<TSchema>>, options);
		},

		/**
		 * Finds all documents matching the filter.
		 */
		find(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			if (strict) validateFilter(filter, schema);
			return collection.find(filter, options);
		},

		/**
		 * Deletes a single document matching the filter.
		 */
		deleteOne(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			if (strict) validateFilter(filter, schema);
			return collection.deleteOne(filter, options);
		},

		/**
		 * Deletes multiple documents matching the filter.
		 */
		deleteMany(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOptions<TypeOf<TSchema>>) {
			if (strict) validateFilter(filter, schema);
			return collection.deleteMany(filter, options);
		},

		/**
		 * Deletes a single document matching the filter and returns it.
		 */
		findOneAndDelete(filter: StrictFilter<TypeOf<TSchema>>, options?: FindOneAndDeleteOptions) {
			if (strict) validateFilter(filter, schema);
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
			if (strict) {
				validateFilter(filter, schema);
				validateOrThrow(schema, newDocument);
			}
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
			if (strict) {
				validateFilter(filter, schema);
				validateOrThrow(schema, newDocument);
			}
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
			if (filter && strict) validateFilter(filter, schema);
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
			if (filter && strict) validateFilter(filter, schema);

			if (!(key in schema.shape)) {
				throw new Error(`Invalid field: ${String(key)}`);
			}

			return filter
				? collection.distinct(key as string, filter)
				: collection.distinct(key as string);
		}
	};
}
