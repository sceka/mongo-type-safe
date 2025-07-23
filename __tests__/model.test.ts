import { z } from "zod";

const UserSchema = z.object({
	name: z.string(),
	age: z.number().optional()
});

describe("UserSchema", () => {
	it("should validate correct user data", () => {
		const validUser = {
			name: "Marko",
			age: 23
		};

		const result = UserSchema.safeParse(validUser);
		expect(result.success).toBe(true);
	});
});
