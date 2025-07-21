import { ZodError, ZodIssue } from "zod";

export function singleSentenceError(issues: ZodIssue[]) {
	let startingErrorMessage: string = "";
	for (let i = 0; i < issues.length; i++) {
		const issuePath = issues[i].path;
		const issueMessage = issues[i].message;

		const combinedIssue = "Error at field - " + issuePath + ": " + issueMessage;
		const wholeErrorMessage = startingErrorMessage.concat(combinedIssue);
		return wholeErrorMessage;
	}
}
