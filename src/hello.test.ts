import { describe, expect, test } from "bun:test";

import { ConfigProvider, Effect } from "effect";

import { EmptyNameError, hello } from "./hello";

const run = <A, E>(effect: Effect.Effect<A, E>, env: Record<string, string> = {}) =>
	Effect.runSync(
		effect.pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(env)))),
	);

describe("hello", () => {
	test("uses the default greeting", () => {
		expect(run(hello("world"))).toBe("hello world");
	});

	test("trims the name", () => {
		expect(run(hello("  world  "))).toBe("hello world");
	});

	test("reads the greeting from config", () => {
		expect(run(hello("world"), { GREETING: "hola" })).toBe("hola world");
	});

	test("fails with EmptyNameError on a blank name", () => {
		const error = run(Effect.flip(hello("   ")));
		expect(error).toBeInstanceOf(EmptyNameError);
		expect(error._tag).toBe("EmptyNameError");
	});
});
