import { GroupStage, StageName, TypedFilter } from "./types";

type AllowedNextStages = {
	$match: ["$group", "$sort", "$limit", "$project", "$skip"];
	$group: ["$sort", "$limit", "$project", "$skip"];
	$sort: ["$limit", "$project", "$skip"];
	$limit: ["$project", "$skip"];
	$project: ["$skip"];
	$skip: [];
	start: ["$match"];
};

type Includes<T extends readonly any[], U> = U extends T[number] ? true : false;

export class PipelineBuilder<T, CurrentStage extends keyof AllowedNextStages = "start"> {
	private stages: object[];

	constructor() {
		this.stages = [];
	}

	match(
		filter: TypedFilter<T>
	): Includes<AllowedNextStages[CurrentStage], "$match"> extends true
		? PipelineBuilder<T, "$match">
		: never {
		this.stages.push({ $match: filter });
		return this as any;
	}

	group(
		groupObj: GroupStage<T>
	): Includes<AllowedNextStages[CurrentStage], "$group"> extends true
		? PipelineBuilder<T, "$group">
		: never {
		this.stages.push({ $group: groupObj });
		return this as any;
	}

	sort(
		sortObj: object
	): Includes<AllowedNextStages[CurrentStage], "$sort"> extends true
		? PipelineBuilder<"$sort">
		: never {
		this.stages.push({ $sort: sortObj });
		return this as any;
	}

	limit(
		n: number
	): Includes<AllowedNextStages[CurrentStage], "$limit"> extends true
		? PipelineBuilder<"$limit">
		: never {
		this.stages.push({ $limit: n });
		return this as any;
	}

	project(
		projObj: object
	): Includes<AllowedNextStages[CurrentStage], "$project"> extends true
		? PipelineBuilder<"$project">
		: never {
		this.stages.push({ $project: projObj });
		return this as any;
	}

	skip(
		n: number
	): Includes<AllowedNextStages[CurrentStage], "$skip"> extends true
		? PipelineBuilder<"$skip">
		: never {
		this.stages.push({ $skip: n });
		return this as any;
	}

	build(): object[] {
		return this.stages;
	}
}
