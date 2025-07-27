import { UpdateFilter } from "mongodb";

type AllowedOperators = "$set" | "$unset" | "$inc" | "$min" | "$max" | "$setOnInsert";

export type SafeUpdate<T> = Partial<Pick<UpdateFilter<T>, AllowedOperators>>;
