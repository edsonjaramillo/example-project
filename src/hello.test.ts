import { describe, expect, test } from "bun:test";

import { hello } from "./hello";

describe("hello", () => {
	test("returns the string prefixed with hello", () => {
		expect(hello("world")).toBe("hello world");
	});

	test("handles an empty string", () => {
		expect(hello("")).toBe("hello ");
	});
});
