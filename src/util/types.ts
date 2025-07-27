import { UpdateFilter } from "mongodb";
import z from "zod";

type AllowedUpdateOperators = "$set" | "$unset" | "$inc" | "$min" | "$max" | "$setOnInsert";

export const allowedOperators = [
	"$gt",
	"$gte",
	"$lt",
	"$lte",
	"$in",
	"$nin",
	"$ne",
	"$eq",
	"$exists",
	"$regex",
	"$and",
	"$or",
	"$not",
	"$nor"
] as const;

type Primitive = string | number | boolean | Date | null;

type FilterOperators<T> = T extends string
	? { $eq?: T; $ne?: T; $in?: T[]; $nin?: T[]; $regex?: RegExp }
	: T extends number
	? { $eq?: T; $ne?: T; $gt?: T; $gte?: T; $lt?: T; $lte?: T; $in?: T[]; $nin?: T[] }
	: T extends boolean
	? { $eq?: T; $ne?: T }
	: T extends Date
	? { $eq?: T; $ne?: T; $gt?: T; $gte?: T; $lt?: T; $lte?: T }
	: never;

export type AllowedFilterOperator = (typeof allowedOperators)[number];

export type SafeUpdate<T> = Partial<Pick<UpdateFilter<T>, AllowedUpdateOperators>>;
export type TypedFilter<T> = { [K in keyof T]?: T[K] | FilterOperators<T[K]> } & {
	$or?: TypedFilter<T>[];
	$and?: TypedFilter<T>[];
	$not?: TypedFilter<T>;
};
